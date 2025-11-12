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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('No autorizado');

    const { feedbackType } = await req.json(); // 'daily', 'weekly', 'monthly'

    console.log(`Generando feedback ${feedbackType} para usuario:`, user.id);

    // Calcular período
    const now = new Date();
    let periodStart: Date;
    let periodEnd = now;

    switch (feedbackType) {
      case 'daily':
        periodStart = new Date(now);
        periodStart.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        throw new Error('Tipo de feedback inválido');
    }

    // Obtener datos del período
    const { data: challenges } = await supabaseClient
      .from('user_daily_challenges')
      .select('*, daily_challenges(*)')
      .eq('user_id', user.id)
      .gte('challenge_date', periodStart.toISOString().split('T')[0])
      .lte('challenge_date', periodEnd.toISOString().split('T')[0]);

    const completedChallenges = challenges?.filter(c => c.completed) || [];
    const totalXP = completedChallenges.reduce((sum, c) => sum + (c.daily_challenges?.xp_reward || 0), 0);
    const totalSavings = completedChallenges.reduce((sum, c) => sum + (c.actual_savings || 0), 0);

    // Obtener insignias desbloqueadas en el período
    const { data: newBadges } = await supabaseClient
      .from('user_badges')
      .select('*')
      .eq('user_id', user.id)
      .gte('earned_at', periodStart.toISOString())
      .lte('earned_at', periodEnd.toISOString());

    // Generar mensaje con IA
    const feedback = await generateFeedbackWithAI({
      feedbackType,
      challengesCompleted: completedChallenges.length,
      totalChallenges: challenges?.length || 0,
      xpEarned: totalXP,
      savings: totalSavings,
      badgesUnlocked: newBadges?.length || 0,
      user
    });

    // Guardar feedback
    await supabaseClient
      .from('progress_feedback')
      .insert({
        user_id: user.id,
        feedback_type: feedbackType,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        total_saved: totalSavings,
        challenges_completed: completedChallenges.length,
        xp_earned: totalXP,
        badges_unlocked: newBadges?.length || 0,
        feedback_message: feedback
      });

    return new Response(JSON.stringify({ 
      success: true,
      feedback,
      stats: {
        challengesCompleted: completedChallenges.length,
        totalChallenges: challenges?.length || 0,
        xpEarned: totalXP,
        savings: totalSavings,
        badgesUnlocked: newBadges?.length || 0
      }
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

async function generateFeedbackWithAI(data: any) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return generateDefaultFeedback(data);
  }

  let prompt = '';
  
  if (data.feedbackType === 'daily') {
    prompt = `Genera un mensaje motivador diario breve (máximo 50 palabras).
Usuario completó ${data.challengesCompleted}/${data.totalChallenges} retos hoy.
XP ganados: ${data.xpEarned}.
${data.challengesCompleted > 0 ? '¡Felicítalo!' : 'Motívalo a intentarlo mañana.'}`;
  } else if (data.feedbackType === 'weekly') {
    prompt = `Genera un resumen semanal motivador (máximo 100 palabras).
- Retos completados: ${data.challengesCompleted}/${data.totalChallenges}
- Ahorro total: $${data.savings} MXN
- XP ganados: ${data.xpEarned}
Destaca logros y motiva para la próxima semana.`;
  } else {
    prompt = `Genera un resumen mensual completo y motivador (máximo 150 palabras).
- Retos completados: ${data.challengesCompleted}
- Ahorro total del mes: $${data.savings} MXN
- XP ganados: ${data.xpEarned}
- Insignias desbloqueadas: ${data.badgesUnlocked}
Celebra los logros del mes y motiva para el próximo.`;
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { 
          role: 'system', 
          content: 'Eres Moni, un coach financiero entusiasta y motivador. Usa emojis y lenguaje positivo.' 
        },
        { role: 'user', content: prompt }
      ],
    }),
  });

  const aiData = await response.json();
  return aiData.choices[0].message.content;
}

function generateDefaultFeedback(data: any): string {
  if (data.feedbackType === 'daily') {
    return data.challengesCompleted > 0
      ? `🎉 ¡Excelente trabajo hoy! Completaste ${data.challengesCompleted} reto(s) y ganaste ${data.xpEarned} XP. ¡Sigue así!`
      : `💪 Hoy no fue tu mejor día, ¡pero mañana es otra oportunidad! Tú puedes lograrlo.`;
  }
  
  if (data.feedbackType === 'weekly') {
    return `📊 Esta semana completaste ${data.challengesCompleted} de ${data.totalChallenges} retos, ahorraste $${data.savings} MXN y ganaste ${data.xpEarned} XP. ${data.challengesCompleted >= data.totalChallenges / 2 ? '¡Excelente trabajo!' : '¡Vamos por más la próxima semana!'}`;
  }
  
  return `✨ Resumen mensual: ${data.challengesCompleted} retos completados, $${data.savings} MXN ahorrados, ${data.xpEarned} XP ganados y ${data.badgesUnlocked} insignia(s) desbloqueada(s). ${data.challengesCompleted > 0 ? '¡Increíble progreso!' : '¡El próximo mes será mejor!'} 🏆`;
}