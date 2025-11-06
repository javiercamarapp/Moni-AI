import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoalReminder {
  id: string;
  user_id: string;
  message: string;
  metadata: {
    goal_id: string;
    reminder_type: string;
    next_reminder: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting goal reminders process...");

    // Initialize Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current date
    const now = new Date();
    const nowISO = now.toISOString();

    console.log("Fetching pending reminders...");

    // Find all goal reminders that need to be sent (next_reminder is in the past or today)
    const { data: reminders, error: remindersError } = await supabase
      .from("notification_history")
      .select("*")
      .eq("notification_type", "goal_reminder")
      .filter("metadata->next_reminder", "lte", nowISO)
      .limit(100);

    if (remindersError) {
      console.error("Error fetching reminders:", remindersError);
      throw remindersError;
    }

    console.log(`Found ${reminders?.length || 0} reminders to process`);

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No reminders to send",
          processed: 0 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each reminder
    for (const reminder of reminders as GoalReminder[]) {
      try {
        console.log(`Processing reminder ${reminder.id} for user ${reminder.user_id}`);

        // Get goal details
        const { data: goal, error: goalError } = await supabase
          .from("goals")
          .select("title, target, current")
          .eq("id", reminder.metadata.goal_id)
          .single();

        // Also check circle_goals
        let goalTitle = "tu meta";
        let isGroupGoal = false;

        if (goalError || !goal) {
          console.log("Checking circle_goals...");
          const { data: circleGoal } = await supabase
            .from("circle_goals")
            .select("title, target_amount")
            .eq("id", reminder.metadata.goal_id)
            .single();
          
          if (circleGoal) {
            goalTitle = circleGoal.title;
            isGroupGoal = true;
          }
        } else {
          goalTitle = goal.title;
        }

        // Create in-app notification
        const notificationMessage = `🎯 Recordatorio: Es momento de realizar tu aporte a "${goalTitle}"`;
        
        const { error: insertError } = await supabase
          .from("notification_history")
          .insert({
            user_id: reminder.user_id,
            notification_type: "goal_reminder_sent",
            message: notificationMessage,
            status: "sent",
            metadata: {
              goal_id: reminder.metadata.goal_id,
              reminder_id: reminder.id,
              is_group_goal: isGroupGoal,
            },
          });

        if (insertError) {
          console.error(`Error creating notification for user ${reminder.user_id}:`, insertError);
          errorCount++;
          continue;
        }

        // Schedule next reminder (15 days from now)
        const nextReminder = new Date(now);
        nextReminder.setDate(nextReminder.getDate() + 15);

        const { error: updateError } = await supabase
          .from("notification_history")
          .update({
            metadata: {
              ...reminder.metadata,
              next_reminder: nextReminder.toISOString(),
              last_sent: nowISO,
            },
          })
          .eq("id", reminder.id);

        if (updateError) {
          console.error(`Error updating reminder ${reminder.id}:`, updateError);
          errorCount++;
          continue;
        }

        console.log(`Successfully processed reminder ${reminder.id}`);
        successCount++;

        // Optional: Send WhatsApp notification if phone number is configured
        const { data: whatsappUser } = await supabase
          .from("whatsapp_users")
          .select("phone_number, is_active")
          .eq("user_id", reminder.user_id)
          .eq("is_active", true)
          .single();

        if (whatsappUser?.phone_number) {
          console.log(`WhatsApp notification available for user ${reminder.user_id}`);
          // You can call WhatsApp webhook here if needed
          // For now, we just log it
        }

      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Reminders processing complete. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: successCount,
        errors: errorCount,
        total: reminders.length,
        message: `Processed ${successCount} reminders successfully`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Error in send-goal-reminders function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
