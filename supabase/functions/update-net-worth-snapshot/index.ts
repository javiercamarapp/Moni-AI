import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  transaction_date: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Fetch current assets
    const { data: assets, error: assetsError } = await supabaseClient
      .from('assets')
      .select('value')
      .eq('user_id', user.id);

    if (assetsError) throw assetsError;

    // Fetch current liabilities
    const { data: liabilities, error: liabilitiesError } = await supabaseClient
      .from('liabilities')
      .select('value')
      .eq('user_id', user.id);

    if (liabilitiesError) throw liabilitiesError;

    // Calculate totals
    const totalAssets = assets?.reduce((sum, a) => sum + Number(a.value), 0) || 0;
    const totalLiabilities = liabilities?.reduce((sum, l) => sum + Number(l.value), 0) || 0;
    const netWorth = totalAssets - totalLiabilities;

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Check if snapshot already exists for today
    const { data: existingSnapshot } = await supabaseClient
      .from('net_worth_snapshots')
      .select('id')
      .eq('user_id', user.id)
      .eq('snapshot_date', today)
      .single();

    if (existingSnapshot) {
      // Update existing snapshot
      const { error: updateError } = await supabaseClient
        .from('net_worth_snapshots')
        .update({
          net_worth: netWorth,
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
        })
        .eq('id', existingSnapshot.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ 
          message: 'Snapshot updated successfully',
          netWorth,
          totalAssets,
          totalLiabilities
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Create new snapshot
      const { error: insertError } = await supabaseClient
        .from('net_worth_snapshots')
        .insert({
          user_id: user.id,
          snapshot_date: today,
          net_worth: netWorth,
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
        });

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ 
          message: 'Snapshot created successfully',
          netWorth,
          totalAssets,
          totalLiabilities
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in update-net-worth-snapshot:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
