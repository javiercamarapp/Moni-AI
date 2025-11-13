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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { notification_id, action, from_user_id } = await req.json();

    if (!notification_id || !action || !from_user_id) {
      throw new Error('notification_id, action, and from_user_id are required');
    }

    if (action === 'accept') {
      // Update friendship status to accepted
      const { error: updateError } = await supabaseClient
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('user_id', from_user_id)
        .eq('friend_id', user.id);

      if (updateError) throw updateError;

      // Create reciprocal friendship
      const { error: reciprocalError } = await supabaseClient
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: from_user_id,
          status: 'accepted'
        });

      if (reciprocalError) throw reciprocalError;

      // Get accepter profile info
      const { data: accepterProfile } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Create notification for the sender
      const { error: responseNotifError } = await supabaseClient
        .from('notification_history')
        .insert({
          user_id: from_user_id,
          notification_type: 'friend_request_accepted',
          message: `${accepterProfile?.full_name || 'Un usuario'} ha aceptado tu solicitud de amistad`,
          status: 'sent',
          metadata: {
            from_user_id: user.id,
            from_user_name: accepterProfile?.full_name || 'Usuario'
          }
        });

      if (responseNotifError) throw responseNotifError;
    } else if (action === 'reject') {
      // Delete the friendship request
      const { error: deleteError } = await supabaseClient
        .from('friendships')
        .delete()
        .eq('user_id', from_user_id)
        .eq('friend_id', user.id);

      if (deleteError) throw deleteError;
    } else {
      throw new Error('Invalid action. Must be "accept" or "reject"');
    }

    // Mark notification as read
    const { error: notifError } = await supabaseClient
      .from('notification_history')
      .update({ status: 'read' })
      .eq('id', notification_id);

    if (notifError) throw notifError;

    return new Response(
      JSON.stringify({ success: true, action }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
