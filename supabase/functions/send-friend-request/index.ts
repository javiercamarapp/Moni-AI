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

    const { friend_id } = await req.json();

    if (!friend_id) {
      throw new Error('friend_id is required');
    }

    // Insert friendship request
    const { error: friendshipError } = await supabaseClient
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friend_id,
        status: 'pending'
      });

    if (friendshipError) throw friendshipError;

    // Get sender profile info
    const { data: senderProfile } = await supabaseClient
      .from('profiles')
      .select('full_name, username')
      .eq('id', user.id)
      .single();

    // Create notification for the recipient
    const { error: notificationError } = await supabaseClient
      .from('notification_history')
      .insert({
        user_id: friend_id,
        notification_type: 'friend_request',
        message: `${senderProfile?.full_name || 'Un usuario'} te ha enviado una solicitud de amistad`,
        status: 'sent',
        metadata: {
          from_user_id: user.id,
          from_user_name: senderProfile?.full_name || 'Usuario',
          from_username: senderProfile?.username || '',
          request_type: 'friend_request'
        }
      });

    if (notificationError) throw notificationError;

    return new Response(
      JSON.stringify({ success: true }),
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
