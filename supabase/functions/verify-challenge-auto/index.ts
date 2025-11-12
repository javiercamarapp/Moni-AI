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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { challengeId, userId } = await req.json();

    console.log('Verificando reto:', challengeId, 'para usuario:', userId);

    // Obtener el reto del usuario
    const { data: userChallenge } = await supabaseClient
      .from('user_daily_challenges')
      .select(`
        *,
        daily_challenges (*)
      `)
      .eq('id', challengeId)
      .eq('user_id', userId)
      .single();

    if (!userChallenge) throw new Error('Reto no encontrado');

    const challenge = userChallenge.daily_challenges;
    
    // Obtener transacciones del período del reto
    const periodStart = new Date(userChallenge.challenge_date);
    const periodEnd = new Date(periodStart);
    
    if (challenge.period === 'weekly') {
      periodEnd.setDate(periodEnd.getDate() + 7);
    } else if (challenge.period === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setDate(periodEnd.getDate() + 1);
    }

    const { data: transactions } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('transaction_date', periodStart.toISOString().split('T')[0])
      .lte('transaction_date', periodEnd.toISOString().split('T')[0]);

    console.log(`Transacciones en período: ${transactions?.length || 0}`);

    // Verificar según tipo de reto
    const verification = await verifyChallenge(challenge, transactions || [], supabaseClient, userId);

    console.log('Resultado verificación:', verification);

    // Actualizar el reto
    await supabaseClient
      .from('user_daily_challenges')
      .update({
        completed: verification.completed,
        status: verification.completed ? 'completed' : 'failed',
        verified_at: new Date().toISOString(),
        actual_savings: verification.actualSavings,
        ai_verification_result: verification.aiAnalysis,
        verification_attempts: userChallenge.verification_attempts + 1
      })
      .eq('id', challengeId);

    // Si completó el reto, otorgar XP
    if (verification.completed) {
      await awardXPAndUpdateLevel(userId, challenge.xp_reward, supabaseClient);
      
      // Crear actividad de amigo
      await supabaseClient
        .from('friend_activity')
        .insert({
          user_id: userId,
          activity_type: 'challenge_completed',
          description: `Completó: ${challenge.title}`,
          xp_earned: challenge.xp_reward
        });

      // Verificar si desbloquea insignias
      await checkAndAwardBadges(userId, supabaseClient);
    }

    return new Response(JSON.stringify({ 
      success: true,
      verification
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function verifyChallenge(challenge: any, transactions: any[], supabaseClient: any, userId: string) {
  let completed = false;
  let actualSavings = 0;
  let aiAnalysis = null;

  switch (challenge.challenge_type) {
    case 'budget_limit':
      // Verificar que el gasto total no exceda el límite
      const totalSpent = transactions
        .filter(t => t.type === 'gasto')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      completed = totalSpent <= challenge.target_amount;
      actualSavings = challenge.target_amount - totalSpent;
      break;

    case 'no_spending':
      // Verificar que no haya gastos en categoría específica
      const spendingInCategory = transactions.filter(t => {
        if (t.type !== 'gasto') return false;
        // Buscar si la descripción o categoría contiene la categoría del reto
        return t.description?.toLowerCase().includes(challenge.category?.toLowerCase());
      });
      
      completed = spendingInCategory.length === 0;
      break;

    case 'manual_entry':
      // Contar registros manuales
      const manualEntries = transactions.length; // Todos los registros del período
      completed = manualEntries >= challenge.target_amount;
      break;

    case 'savings':
      // Verificar ahorros
      const savingsAmount = transactions
        .filter(t => t.type === 'ingreso' || t.description?.toLowerCase().includes('ahorro'))
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      completed = savingsAmount >= challenge.target_amount;
      actualSavings = savingsAmount;
      break;
  }

  // Análisis adicional con IA si está disponible
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (LOVABLE_API_KEY) {
      aiAnalysis = await analyzeWithAI(challenge, transactions, completed, LOVABLE_API_KEY);
    }
  } catch (error) {
    console.error('Error en análisis IA:', error);
  }

  return { completed, actualSavings, aiAnalysis };
}

async function analyzeWithAI(challenge: any, transactions: any[], completed: boolean, apiKey: string) {
  const prompt = `Analiza este reto financiero:

**Reto:** ${challenge.title}
**Descripción:** ${challenge.description}
**Tipo:** ${challenge.challenge_type}
**Estado:** ${completed ? 'COMPLETADO' : 'NO COMPLETADO'}

**Transacciones del período:**
${transactions.slice(0, 10).map(t => `- ${t.description}: $${t.amount} MXN (${t.type})`).join('\n')}

Proporciona un análisis breve y motivador (máximo 100 palabras) sobre el desempeño del usuario.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Eres Moni, un coach financiero motivador.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function awardXPAndUpdateLevel(userId: string, xp: number, supabaseClient: any) {
  // Obtener nivel actual
  const { data: userLevel } = await supabaseClient
    .from('user_levels')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!userLevel) {
    // Crear nivel si no existe
    await supabaseClient
      .from('user_levels')
      .insert({ user_id: userId, total_xp: xp });
    return;
  }

  const newTotalXP = userLevel.total_xp + xp;
  let newLevel = userLevel.current_level;
  let xpToNextLevel = userLevel.xp_to_next_level;

  // Calcular nuevo nivel (cada nivel requiere más XP)
  while (newTotalXP >= xpToNextLevel) {
    newLevel++;
    xpToNextLevel = calculateXPForLevel(newLevel + 1);
  }

  const levelTitle = getLevelTitle(newLevel);

  await supabaseClient
    .from('user_levels')
    .update({
      total_xp: newTotalXP,
      current_level: newLevel,
      xp_to_next_level: xpToNextLevel,
      level_title: levelTitle
    })
    .eq('user_id', userId);

  // Actualizar ranking mensual
  const now = new Date();
  await supabaseClient
    .from('monthly_rankings')
    .upsert({
      user_id: userId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      total_points: newTotalXP,
      challenges_completed: 0 // Se actualizará después
    }, { onConflict: 'user_id,month,year' });
}

function calculateXPForLevel(level: number): number {
  // Fórmula exponencial: XP = 1000 * (1.5 ^ (level - 1))
  return Math.floor(1000 * Math.pow(1.5, level - 1));
}

function getLevelTitle(level: number): string {
  if (level < 5) return 'Ahorrador Novato';
  if (level < 10) return 'Ahorrador Comprometido';
  if (level < 15) return 'Ahorrador Experto';
  if (level < 25) return 'Maestro del Ahorro';
  return 'Leyenda Financiera';
}

async function checkAndAwardBadges(userId: string, supabaseClient: any) {
  // Obtener retos completados del usuario
  const { data: completedChallenges } = await supabaseClient
    .from('user_daily_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', true)
    .order('challenge_date', { ascending: false });

  // Calcular racha actual
  let currentStreak = 0;
  if (completedChallenges && completedChallenges.length > 0) {
    const today = new Date();
    for (let i = 0; i < completedChallenges.length; i++) {
      const challengeDate = new Date(completedChallenges[i].challenge_date);
      const daysDiff = Math.floor((today.getTime() - challengeDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Verificar insignias de racha
  const { data: streakBadges } = await supabaseClient
    .from('badges')
    .select('*')
    .eq('requirement_type', 'streak')
    .lte('requirement_value', currentStreak);

  if (streakBadges) {
    for (const badge of streakBadges) {
      // Verificar si ya tiene la insignia
      const { data: existing } = await supabaseClient
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .eq('badge_name', badge.name)
        .single();

      if (!existing) {
        await supabaseClient
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_name: badge.name,
            badge_description: badge.description
          });
      }
    }
  }
}