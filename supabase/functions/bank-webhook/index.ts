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

    // Webhook de Plaid/Belvo para transacciones bancarias
    const body = await req.json();
    console.log('Bank webhook received:', JSON.stringify(body, null, 2));

    // Ejemplo de payload de Plaid
    const { webhook_type, webhook_code, item_id } = body;

    if (webhook_type === 'TRANSACTIONS') {
      if (webhook_code === 'DEFAULT_UPDATE' || webhook_code === 'INITIAL_UPDATE') {
        // Buscar usuario por item_id
        const { data: bankConnection } = await supabase
          .from('bank_connections')
          .select('user_id, access_token')
          .eq('plaid_item_id', item_id)
          .eq('is_active', true)
          .single();

        if (!bankConnection) {
          console.log('Bank connection not found for item_id:', item_id);
          return new Response(JSON.stringify({ status: 'ignored' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          });
        }

        // Sincronizar transacciones
        await supabase.functions.invoke('sync-bank-transactions', {
          body: {
            userId: bankConnection.user_id,
            itemId: item_id,
            accessToken: bankConnection.access_token
          }
        });

        console.log('Transactions synced for user:', bankConnection.user_id);
      }
    }

    return new Response(JSON.stringify({ status: 'processed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Bank webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
