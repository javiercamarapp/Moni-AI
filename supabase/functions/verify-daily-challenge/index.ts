import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting automatic daily challenge verification...');

    const today = new Date().toISOString().split('T')[0];

    // Obtener retos activos del día
    const { data: activeChallenges, error: challengesError } = await supabase
      .from('user_daily_challenges')
      .select(`
        *,
        daily_challenges (*)
      `)
      .eq('challenge_date', today)
      .eq('status', 'active');

    if (challengesError) throw challengesError;
    if (!activeChallenges || activeChallenges.length === 0) {
      console.log('No active challenges to verify today');
      return new Response(JSON.stringify({ message: 'No challenges to verify' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${activeChallenges.length} active challenges to verify`);

    let verifiedCount = 0;
    let failedCount = 0;

    for (const userChallenge of activeChallenges) {
      try {
        const challenge = userChallenge.daily_challenges;
        
        // Obtener transacciones del usuario para hoy
        const { data: transactions, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userChallenge.user_id)
          .eq('transaction_date', today)
          .eq('type', 'gasto');

        if (txError) throw txError;

        let isCompleted = false;
        let verificationDetails: any = {
          challenge_type: challenge.challenge_type,
          verified_at: new Date().toISOString(),
          transactions_analyzed: transactions?.length || 0
        };

        // Verificar según el tipo de reto
        switch (challenge.challenge_type) {
          case 'budget_limit': {
            // Verificar que el gasto total no exceda el límite
            const totalSpent = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
            isCompleted = totalSpent <= Number(challenge.target_amount);
            verificationDetails.total_spent = totalSpent;
            verificationDetails.limit = challenge.target_amount;
            break;
          }

          case 'no_spending': {
            // Verificar que no haya gastos en la categoría específica
            const categorySpending = transactions?.filter(tx => {
              const txCategory = tx.categories?.name?.toLowerCase() || '';
              return txCategory.includes(challenge.category?.toLowerCase() || '');
            }) || [];
            
            isCompleted = categorySpending.length === 0;
            verificationDetails.category = challenge.category;
            verificationDetails.spending_count = categorySpending.length;
            break;
          }

          case 'manual_entry': {
            // Verificar que se hayan registrado suficientes transacciones manualmente
            const manualEntries = transactions?.filter(tx => 
              !tx.account || tx.account === 'manual' || tx.account === 'efectivo'
            ) || [];
            
            isCompleted = manualEntries.length >= Number(challenge.target_amount || 3);
            verificationDetails.manual_entries = manualEntries.length;
            verificationDetails.required = challenge.target_amount;
            break;
          }

          case 'savings': {
            // Verificar que haya ahorrado la cantidad objetivo
            const { data: savingsTx } = await supabase
              .from('transactions')
              .select('*')
              .eq('user_id', userChallenge.user_id)
              .eq('transaction_date', today)
              .eq('type', 'ingreso')
              .ilike('description', '%ahorro%');

            const savedAmount = savingsTx?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
            isCompleted = savedAmount >= Number(challenge.target_amount || 0);
            verificationDetails.saved_amount = savedAmount;
            verificationDetails.target = challenge.target_amount;
            break;
          }
        }

        // Usar IA para verificación adicional si hay dudas
        if (transactions && transactions.length > 0) {
          const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
          
          const aiPrompt = `Analiza estas transacciones del día y determina si el usuario cumplió el reto: "${challenge.title}".

Descripción del reto: ${challenge.description}
Tipo de reto: ${challenge.challenge_type}

Transacciones del día:
${transactions.map(tx => `- ${tx.description}: $${tx.amount} (${tx.categories?.name || 'Sin categoría'})`).join('\n')}

¿El usuario cumplió el reto? Responde con un análisis breve.`;

          try {
            const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  { role: 'system', content: 'Eres un asistente financiero que verifica el cumplimiento de retos diarios.' },
                  { role: 'user', content: aiPrompt }
                ],
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              verificationDetails.ai_analysis = aiData.choices[0].message.content;
            }
          } catch (aiError) {
            console.error('AI verification error:', aiError);
          }
        }

        // Actualizar el estado del reto
        const newStatus = isCompleted ? 'completed' : 'failed';
        const { error: updateError } = await supabase
          .from('user_daily_challenges')
          .update({
            status: newStatus,
            completed: isCompleted,
            verified_at: new Date().toISOString(),
            ai_verification_result: verificationDetails
          })
          .eq('id', userChallenge.id);

        if (updateError) throw updateError;

        // Si completó el reto, dar XP
        if (isCompleted) {
          await supabase.rpc('increment_social_xp', {
            target_user_id: userChallenge.user_id,
            xp_amount: challenge.xp_reward
          });

          // Crear actividad de amigo
          await supabase
            .from('friend_activity')
            .insert({
              user_id: userChallenge.user_id,
              activity_type: 'challenge_completed',
              description: `completó el reto "${challenge.title}"`,
              xp_earned: challenge.xp_reward
            });

          verifiedCount++;
          console.log(`Challenge completed for user ${userChallenge.user_id}`);
        } else {
          failedCount++;
          console.log(`Challenge failed for user ${userChallenge.user_id}`);
        }

      } catch (error) {
        console.error(`Error verifying challenge ${userChallenge.id}:`, error);
      }
    }

    console.log(`Verification complete: ${verifiedCount} completed, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        message: 'Verification complete',
        verified: verifiedCount,
        failed: failedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-daily-challenge:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
