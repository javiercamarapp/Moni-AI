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

    console.log('🤖 Moni AI: Iniciando ajuste automático de metas...');

    // Obtener todas las metas activas (individuales)
    const { data: goals, error: goalsError } = await supabaseClient
      .from('goals')
      .select('*, transactions!inner(amount, type, transaction_date)')
      .order('created_at', { ascending: false });

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
      throw goalsError;
    }

    let adjustedCount = 0;
    let notificationsCount = 0;

    // Procesar cada meta individual
    for (const goal of goals || []) {
      const result = await adjustIndividualGoal(supabaseClient, goal);
      if (result.adjusted) {
        adjustedCount++;
        if (result.notificationSent) notificationsCount++;
      }
    }

    // Obtener todas las metas grupales activas
    const { data: groupGoals, error: groupGoalsError } = await supabaseClient
      .from('circle_goals')
      .select('*, circle_goal_members(*), circles(name)');

    if (groupGoalsError) {
      console.error('Error fetching group goals:', groupGoalsError);
    } else {
      // Procesar cada meta grupal
      for (const groupGoal of groupGoals || []) {
        const result = await adjustGroupGoal(supabaseClient, groupGoal);
        if (result.adjusted) {
          adjustedCount++;
          if (result.notificationSent) notificationsCount++;
        }
      }
    }

    console.log(`✅ Ajuste completado: ${adjustedCount} metas ajustadas, ${notificationsCount} notificaciones enviadas`);

    return new Response(
      JSON.stringify({
        success: true,
        adjusted: adjustedCount,
        notifications: notificationsCount,
        message: `Moni AI ajustó ${adjustedCount} metas automáticamente`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in auto-adjust-goals:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function adjustIndividualGoal(supabaseClient: any, goal: any) {
  try {
    const currentAmount = goal.current || 0;
    const targetAmount = goal.target || 0;
    const deadline = goal.deadline ? new Date(goal.deadline) : null;
    const today = new Date();

    // Si la meta ya está completada, no ajustar
    if (currentAmount >= targetAmount) {
      return { adjusted: false, notificationSent: false };
    }

    // Calcular días restantes
    const daysRemaining = deadline 
      ? Math.max(1, Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
      : 90; // Default 90 días si no hay deadline

    const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));
    const remainingAmount = targetAmount - currentAmount;

    // Calcular promedio de ahorro de las últimas 4 semanas
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const { data: recentTransactions } = await supabaseClient
      .from('transactions')
      .select('amount, transaction_date')
      .eq('user_id', goal.user_id)
      .eq('type', 'ingreso')
      .gte('transaction_date', fourWeeksAgo.toISOString().split('T')[0]);

    const avgWeeklySavings = recentTransactions && recentTransactions.length > 0
      ? recentTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0) / 4
      : 0;

    // Calcular nuevo monto semanal requerido
    const newWeeklySaving = Math.ceil(remainingAmount / weeksRemaining);
    const oldWeeklySaving = goal.required_weekly_saving || newWeeklySaving;

    // Calcular nueva fecha predicha
    const predictedWeeks = avgWeeklySavings > 0 
      ? Math.ceil(remainingAmount / avgWeeklySavings)
      : weeksRemaining;
    
    const newPredictedDate = new Date();
    newPredictedDate.setDate(newPredictedDate.getDate() + (predictedWeeks * 7));

    // Solo ajustar si hay un cambio significativo (más de 10%)
    const changePercentage = Math.abs((newWeeklySaving - oldWeeklySaving) / oldWeeklySaving) * 100;
    
    if (changePercentage < 10) {
      return { adjusted: false, notificationSent: false };
    }

    // Actualizar la meta
    const { error: updateError } = await supabaseClient
      .from('goals')
      .update({
        required_weekly_saving: newWeeklySaving,
        predicted_completion_date: newPredictedDate.toISOString().split('T')[0],
        ai_confidence: avgWeeklySavings > 0 ? 0.85 : 0.6,
      })
      .eq('id', goal.id);

    if (updateError) {
      console.error('Error updating goal:', updateError);
      return { adjusted: false, notificationSent: false };
    }

    // Registrar el ajuste
    const reason = avgWeeklySavings > oldWeeklySaving 
      ? 'Ajuste automático: vas adelantado en tu progreso' 
      : 'Ajuste automático: necesitas aumentar tu ahorro semanal';

    const { error: adjustmentError } = await supabaseClient
      .from('goal_adjustments')
      .insert({
        goal_id: goal.id,
        user_id: goal.user_id,
        old_weekly_amount: oldWeeklySaving,
        new_weekly_amount: newWeeklySaving,
        old_predicted_date: goal.predicted_completion_date,
        new_predicted_date: newPredictedDate.toISOString().split('T')[0],
        reason: reason,
        adjustment_type: 'automatic',
      });

    if (adjustmentError) {
      console.error('Error inserting adjustment:', adjustmentError);
    }

    // Enviar notificación
    const notificationSent = await sendNotification(supabaseClient, {
      user_id: goal.user_id,
      type: 'goal_auto_adjustment',
      title: '🧠 Moni AI ha optimizado tu plan',
      message: `Tu plan de ahorro para "${goal.title}" fue ajustado. Nuevo ahorro semanal: $${newWeeklySaving.toLocaleString()} MXN. Nueva fecha estimada: ${formatDate(newPredictedDate)}.`,
      metadata: {
        goal_id: goal.id,
        old_amount: oldWeeklySaving,
        new_amount: newWeeklySaving,
        new_date: newPredictedDate.toISOString().split('T')[0],
      },
    });

    console.log(`✅ Meta "${goal.title}" ajustada: $${oldWeeklySaving} → $${newWeeklySaving}/semana`);

    return { adjusted: true, notificationSent };
  } catch (error) {
    console.error('Error adjusting individual goal:', error);
    return { adjusted: false, notificationSent: false };
  }
}

async function adjustGroupGoal(supabaseClient: any, groupGoal: any) {
  try {
    const currentAmount = groupGoal.current_amount || 0;
    const targetAmount = groupGoal.target_amount || 0;
    const deadline = groupGoal.deadline ? new Date(groupGoal.deadline) : null;
    const today = new Date();
    const memberCount = groupGoal.circle_goal_members?.length || 1;

    // Si la meta ya está completada, no ajustar
    if (currentAmount >= targetAmount) {
      return { adjusted: false, notificationSent: false };
    }

    // Calcular días restantes
    const daysRemaining = deadline 
      ? Math.max(1, Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
      : 90;

    const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));
    const remainingAmount = targetAmount - currentAmount;

    // Calcular nuevo monto semanal requerido por persona
    const newWeeklySaving = Math.ceil(remainingAmount / weeksRemaining / memberCount);
    const oldWeeklySaving = groupGoal.required_weekly_saving || newWeeklySaving;

    // Calcular nueva fecha predicha basada en el promedio de contribuciones
    const avgContributionRate = currentAmount / Math.max(1, Math.ceil((today.getTime() - new Date(groupGoal.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7)));
    const predictedWeeks = avgContributionRate > 0 
      ? Math.ceil(remainingAmount / avgContributionRate)
      : weeksRemaining;
    
    const newPredictedDate = new Date();
    newPredictedDate.setDate(newPredictedDate.getDate() + (predictedWeeks * 7));

    // Solo ajustar si hay un cambio significativo (más de 10%)
    const changePercentage = Math.abs((newWeeklySaving - oldWeeklySaving) / oldWeeklySaving) * 100;
    
    if (changePercentage < 10) {
      return { adjusted: false, notificationSent: false };
    }

    // Actualizar la meta grupal
    const { error: updateError } = await supabaseClient
      .from('circle_goals')
      .update({
        required_weekly_saving: newWeeklySaving,
        predicted_completion_date: newPredictedDate.toISOString().split('T')[0],
        ai_confidence: avgContributionRate > 0 ? 0.85 : 0.6,
      })
      .eq('id', groupGoal.id);

    if (updateError) {
      console.error('Error updating group goal:', updateError);
      return { adjusted: false, notificationSent: false };
    }

    // Registrar el ajuste
    const reason = 'Ajuste automático grupal según progreso colectivo';

    const { error: adjustmentError } = await supabaseClient
      .from('goal_group_adjustments')
      .insert({
        goal_id: groupGoal.id,
        old_weekly_amount: oldWeeklySaving,
        new_weekly_amount: newWeeklySaving,
        old_predicted_date: groupGoal.predicted_completion_date,
        new_predicted_date: newPredictedDate.toISOString().split('T')[0],
        reason: reason,
        members_affected: memberCount,
        adjustment_type: 'automatic',
      });

    if (adjustmentError) {
      console.error('Error inserting group adjustment:', adjustmentError);
    }

    // Enviar notificación a todos los miembros
    const circleName = groupGoal.circles?.name || 'el grupo';
    let notificationsSent = 0;

    for (const member of groupGoal.circle_goal_members || []) {
      const sent = await sendNotification(supabaseClient, {
        user_id: member.user_id,
        type: 'group_goal_auto_adjustment',
        title: '🤝 Moni AI ajustó la meta grupal',
        message: `Tu grupo "${circleName}" - "${groupGoal.title}" fue optimizado automáticamente. Cada miembro debe ahorrar $${newWeeklySaving.toLocaleString()} MXN/semana para cumplir la meta a tiempo.`,
        metadata: {
          goal_id: groupGoal.id,
          old_amount: oldWeeklySaving,
          new_amount: newWeeklySaving,
          new_date: newPredictedDate.toISOString().split('T')[0],
          members_affected: memberCount,
        },
      });
      if (sent) notificationsSent++;
    }

    console.log(`✅ Meta grupal "${groupGoal.title}" ajustada: $${oldWeeklySaving} → $${newWeeklySaving}/semana por persona`);

    return { adjusted: true, notificationSent: notificationsSent > 0 };
  } catch (error) {
    console.error('Error adjusting group goal:', error);
    return { adjusted: false, notificationSent: false };
  }
}

async function sendNotification(supabaseClient: any, notification: any) {
  try {
    const { error } = await supabaseClient
      .from('notification_history')
      .insert({
        user_id: notification.user_id,
        notification_type: notification.type,
        message: notification.message,
        status: 'sent',
        metadata: notification.metadata,
      });

    if (error) {
      console.error('Error sending notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in sendNotification:', error);
    return false;
  }
}

function formatDate(date: Date): string {
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}