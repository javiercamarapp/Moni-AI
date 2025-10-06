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
    console.log('Running scheduled notifications...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    const dayOfWeek = now.getDay(); // 0 = domingo, 1 = lunes, etc.

    // Función para verificar si está en horario silencioso
    const isQuietHours = (quietStart: string, quietEnd: string, currentTime: string): boolean => {
      if (!quietStart || !quietEnd) return false;
      
      // Convertir a minutos desde medianoche
      const [currentH, currentM] = currentTime.split(':').map(Number);
      const [startH, startM] = quietStart.split(':').map(Number);
      const [endH, endM] = quietEnd.split(':').map(Number);
      
      const current = currentH * 60 + currentM;
      const start = startH * 60 + startM;
      const end = endH * 60 + endM;
      
      // Si el horario silencioso cruza medianoche (ej: 22:00 - 08:00)
      if (start > end) {
        return current >= start || current <= end;
      }
      return current >= start && current <= end;
    };

    // Obtener usuarios con notificaciones activas
    const { data: users } = await supabase
      .from('notification_settings')
      .select('user_id, daily_summary, weekly_analysis, savings_tips, goal_reminders, preferred_notification_time, quiet_hours_start, quiet_hours_end')
      .or('daily_summary.eq.true,weekly_analysis.eq.true,savings_tips.eq.true,goal_reminders.eq.true');

    if (!users || users.length === 0) {
      console.log('No users with active notifications');
      return new Response(JSON.stringify({ status: 'no_users' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sentCount = 0;

    for (const user of users) {
      try {
        // Verificar si está en horario silencioso
        const inQuietHours = isQuietHours(
          user.quiet_hours_start?.substring(0, 5) || '22:00',
          user.quiet_hours_end?.substring(0, 5) || '08:00',
          currentTime
        );

        if (inQuietHours) {
          console.log(`User ${user.user_id} is in quiet hours, skipping notifications`);
          continue;
        }

        // Resumen diario (a la hora preferida del usuario)
        if (user.daily_summary && currentTime === user.preferred_notification_time?.substring(0, 5)) {
          await supabase.functions.invoke('send-proactive-message', {
            body: {
              userId: user.user_id,
              type: 'daily_summary',
              data: {}
            }
          });
          sentCount++;
        }

        // Análisis semanal (lunes a las 9am)
        if (user.weekly_analysis && dayOfWeek === 1 && currentTime === '09:00') {
          await supabase.functions.invoke('send-proactive-message', {
            body: {
              userId: user.user_id,
              type: 'weekly_summary',
              data: {}
            }
          });
          sentCount++;
        }

        // Tips de ahorro (miércoles y sábado)
        if (user.savings_tips && (dayOfWeek === 3 || dayOfWeek === 6) && currentTime === '10:00') {
          await supabase.functions.invoke('send-proactive-message', {
            body: {
              userId: user.user_id,
              type: 'savings_tip',
              data: {}
            }
          });
          sentCount++;
        }

        // Recordatorios de metas (cada 3 días a las 6pm)
        if (user.goal_reminders && now.getDate() % 3 === 0 && currentTime === '18:00') {
          const { data: goals } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', user.user_id);

          if (goals && goals.length > 0) {
            await supabase.functions.invoke('send-proactive-message', {
              body: {
                userId: user.user_id,
                type: 'goal_reminder',
                data: { goalsCount: goals.length }
              }
            });
            sentCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing notifications for user ${user.user_id}:`, error);
      }
    }

    console.log(`Sent ${sentCount} notifications`);

    return new Response(JSON.stringify({ 
      success: true,
      notificationsSent: sentCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Scheduled notifications error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
