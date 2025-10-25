import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Challenge {
  id: string;
  user_id: string;
  category: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  end_date: string;
  days_status: any[];
  status: string;
  challenge_type: string;
  daily_goal: number | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get active challenges
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('*')
      .eq('status', 'active');

    if (challengesError) throw challengesError;

    console.log(`📊 Verificando ${challenges?.length || 0} retos activos`);

    // Process each challenge
    for (const challenge of challenges || []) {
      await verifyChallenge(supabase, challenge);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Verificados ${challenges?.length || 0} retos` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function verifyChallenge(supabase: any, challenge: Challenge) {
  try {
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Initialize days_status array - handle both string and array cases
    let daysStatus = [];
    
    try {
      if (typeof challenge.days_status === 'string') {
        // Parse if it's a string
        daysStatus = JSON.parse(challenge.days_status);
      } else if (Array.isArray(challenge.days_status)) {
        // Make a deep copy if it's already an array
        daysStatus = JSON.parse(JSON.stringify(challenge.days_status));
      }
      
      // Validate and initialize if needed
      if (!Array.isArray(daysStatus) || daysStatus.length === 0) {
        daysStatus = Array(7).fill(null).map(() => ({ completed: null }));
      }
    } catch (parseError) {
      console.error('Error parsing days_status:', parseError);
      daysStatus = Array(7).fill(null).map(() => ({ completed: null }));
    }

    console.log(`🔍 Verificando reto: ${challenge.id} (${challenge.category})`);
    console.log(`📅 Inicio: ${challenge.start_date} | Fin: ${challenge.end_date}`);
    console.log(`🗓️  Hoy: ${today.toISOString().split('T')[0]}`);

    // Check each day of the week
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + dayIndex);
      dayDate.setHours(0, 0, 0, 0);

      // Only check days that have already passed
      if (dayDate > today) {
        console.log(`⏭️  Día ${dayIndex} aún no ha llegado`);
        continue;
      }

      // Skip if already checked
      if (daysStatus[dayIndex]?.completed !== null && daysStatus[dayIndex]?.completed !== undefined) {
        console.log(`✅ Día ${dayIndex} ya verificado: ${daysStatus[dayIndex].completed ? 'cumplido' : 'no cumplido'}`);
        continue;
      }

      // Get transactions for this specific day
      const dayStart = dayDate.toISOString().split('T')[0];
      const dayEnd = dayDate.toISOString().split('T')[0];

      console.log(`📅 Verificando día ${dayIndex} (${dayStart})`);

      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('user_id', challenge.user_id)
        .eq('type', 'gasto')
        .gte('transaction_date', dayStart)
        .lte('transaction_date', dayEnd);

      if (txError) {
        console.error('Error fetching transactions:', txError);
        continue;
      }

      console.log(`💰 Transacciones del día ${dayIndex}:`, transactions?.length || 0);

      // Calculate spending for the challenge category
      let daySpending = 0;
      
      if (transactions && transactions.length > 0) {
        for (const tx of transactions) {
          const categoryName = tx.categories?.name?.toLowerCase() || '';
          const txDescription = tx.description?.toLowerCase() || '';
          
          // Match challenge category
          const challengeCategory = challenge.category.toLowerCase();
          
          if (categoryName.includes(challengeCategory) || 
              txDescription.includes(challengeCategory)) {
            daySpending += Number(tx.amount);
          }
        }
      }

      console.log(`💸 Gasto del día en categoría "${challenge.category}": $${daySpending}`);

      // Determine if challenge was met for this day based on challenge type
      const challengeType = challenge.challenge_type || 'spending_limit';
      let wasCompleted = false;
      
      if (challengeType === 'days_without') {
        // Para "días sin gastar": completado si NO hubo gastos ese día
        wasCompleted = daySpending === 0;
        console.log(`🎯 Tipo: days_without | Gasto: $${daySpending} | Cumplido: ${wasCompleted ? 'SÍ (sin gastos)' : 'NO (hubo gastos)'}`);
      } else if (challengeType === 'daily_budget') {
        // Para "presupuesto diario": completado si gasto <= presupuesto diario
        const dailyTarget = challenge.target_amount / 7;
        wasCompleted = daySpending <= dailyTarget;
        console.log(`🎯 Tipo: daily_budget | Meta: $${dailyTarget.toFixed(2)} | Gasto: $${daySpending.toFixed(2)} | Cumplido: ${wasCompleted}`);
      } else {
        // Para "spending_limit": se verifica al final de la semana
        // Día por día solo acumulamos el gasto
        wasCompleted = null; // No se verifica día por día
        console.log(`🎯 Tipo: spending_limit | Gasto acumulado: $${daySpending.toFixed(2)} (se verifica al final)`);
      }

      // Update day status - create new object
      daysStatus[dayIndex] = {
        completed: wasCompleted,
        amount: daySpending,
        date: dayStart
      };
    }

    // Update challenge in database - ensure days_status is saved as JSONB array
    console.log(`💾 Guardando estado de días:`, JSON.stringify(daysStatus));
    
    const { error: updateError } = await supabase
      .from('challenges')
      .update({ 
        days_status: daysStatus, // This will be saved as JSONB
        current_amount: challenge.current_amount
      })
      .eq('id', challenge.id);

    if (updateError) {
      console.error('❌ Error updating challenge:', updateError);
    } else {
      console.log(`✅ Reto ${challenge.id} actualizado correctamente`);
      
      // Verify the update
      const { data: updated } = await supabase
        .from('challenges')
        .select('days_status')
        .eq('id', challenge.id)
        .single();
      
      console.log(`🔍 Verificación después de guardar:`, typeof updated?.days_status, updated?.days_status);
    }

  } catch (error: any) {
    console.error(`Error processing challenge ${challenge.id}:`, error);
  }
}
