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

    console.log('Starting daily challenge distribution...');

    // Obtener usuarios activos con WhatsApp
    const { data: whatsappUsers, error: usersError } = await supabase
      .from('whatsapp_users')
      .select('user_id, phone_number')
      .eq('is_active', true);

    if (usersError) throw usersError;
    if (!whatsappUsers || whatsappUsers.length === 0) {
      console.log('No active WhatsApp users found');
      return new Response(JSON.stringify({ message: 'No users to send challenges' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${whatsappUsers.length} active WhatsApp users`);

    // Obtener retos disponibles
    const { data: challenges, error: challengesError } = await supabase
      .from('daily_challenges')
      .select('*');

    if (challengesError) throw challengesError;
    if (!challenges || challenges.length === 0) {
      throw new Error('No challenges available');
    }

    const today = new Date().toISOString().split('T')[0];
    let successCount = 0;
    let errorCount = 0;

    // Para cada usuario, seleccionar un reto aleatorio y enviarlo
    for (const user of whatsappUsers) {
      try {
        // Verificar si ya tiene un reto para hoy
        const { data: existingChallenge } = await supabase
          .from('user_daily_challenges')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('challenge_date', today)
          .maybeSingle();

        if (existingChallenge) {
          console.log(`User ${user.user_id} already has a challenge for today`);
          continue;
        }

        // Seleccionar un reto aleatorio
        const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];

        // Crear mensaje de WhatsApp
        const message = `🎯 *Reto del día*\n\n*${randomChallenge.title}*\n\n${randomChallenge.description}\n\n✨ Recompensa: ${randomChallenge.xp_reward} XP\n\nResponde "Acepto" para activar este reto.`;

        // Enviar mensaje por WhatsApp
        const whatsappResponse = await fetch('https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('WHATSAPP_ACCESS_TOKEN')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: user.phone_number,
            type: 'text',
            text: { body: message }
          })
        });

        if (!whatsappResponse.ok) {
          console.error(`Failed to send WhatsApp message to ${user.phone_number}`);
          errorCount++;
          continue;
        }

        // Guardar el reto como pendiente de aceptación
        const { error: insertError } = await supabase
          .from('user_daily_challenges')
          .insert({
            user_id: user.user_id,
            challenge_id: randomChallenge.id,
            challenge_date: today,
            status: 'pending_verification', // Cambiado de 'pending' a 'pending_verification' 
            completed: false
          });

        if (insertError) {
          console.error(`Failed to insert challenge for user ${user.user_id}:`, insertError);
          errorCount++;
        } else {
          successCount++;
          console.log(`Challenge sent to user ${user.user_id}`);
        }

      } catch (error) {
        console.error(`Error processing user ${user.user_id}:`, error);
        errorCount++;
      }
    }

    console.log(`Daily challenges sent: ${successCount} successful, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        message: 'Daily challenges sent',
        success: successCount,
        errors: errorCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-daily-challenge:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
