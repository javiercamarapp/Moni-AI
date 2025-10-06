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
    const { userId, itemId, accessToken } = await req.json();
    
    console.log('Syncing bank transactions for user:', userId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
    const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'sandbox';

    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      throw new Error('Plaid credentials not configured');
    }

    // Obtener transacciones de Plaid
    const plaidUrl = PLAID_ENV === 'production' 
      ? 'https://production.plaid.com'
      : PLAID_ENV === 'development'
      ? 'https://development.plaid.com'
      : 'https://sandbox.plaid.com';

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const plaidResponse = await fetch(`${plaidUrl}/transactions/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate
      })
    });

    if (!plaidResponse.ok) {
      const errorText = await plaidResponse.text();
      console.error('Plaid API error:', plaidResponse.status, errorText);
      throw new Error(`Plaid API error: ${plaidResponse.status}`);
    }

    const plaidData = await plaidResponse.json();
    const transactions = plaidData.transactions || [];

    console.log(`Found ${transactions.length} transactions`);

    // Procesar cada transacción
    for (const transaction of transactions) {
      // Verificar si ya existe
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('description', transaction.name)
        .eq('amount', Math.abs(transaction.amount))
        .eq('transaction_date', transaction.date)
        .single();

      if (existingTx) {
        console.log('Transaction already exists:', transaction.transaction_id);
        continue;
      }

      // Determinar tipo (Plaid usa números negativos para gastos)
      const type = transaction.amount < 0 ? 'gasto' : 'ingreso';
      const amount = Math.abs(transaction.amount);

      // Usar IA para categorizar
      const { data: categoryResult } = await supabase.functions.invoke('categorize-transaction', {
        body: {
          description: transaction.name,
          amount,
          type,
          userId,
          merchantName: transaction.merchant_name
        }
      });

      // Guardar transacción
      const { data: newTransaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type,
          amount,
          description: transaction.name,
          category_id: categoryResult?.categoryId,
          transaction_date: transaction.date,
          payment_method: 'bank_sync',
          account: transaction.account_id
        })
        .select()
        .single();

      if (txError) {
        console.error('Error saving transaction:', txError);
        continue;
      }

      console.log('Transaction saved:', newTransaction.id);

      // Verificar si debe enviar alerta
      await checkAndSendAlert(supabase, userId, newTransaction);
    }

    // Actualizar última sincronización
    await supabase
      .from('bank_connections')
      .update({ last_sync: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('plaid_item_id', itemId);

    return new Response(JSON.stringify({ 
      success: true,
      transactionsProcessed: transactions.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkAndSendAlert(supabase: any, userId: string, transaction: any) {
  // Obtener configuración de notificaciones
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!settings || !settings.spending_alerts) {
    return;
  }

  // Verificar si el monto supera el umbral
  if (transaction.type === 'gasto' && transaction.amount >= settings.transaction_alert_threshold) {
    await supabase.functions.invoke('send-proactive-message', {
      body: {
        userId,
        type: 'spending_alert',
        data: {
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.transaction_date
        }
      }
    });
  }

  // Verificar gasto diario
  const today = new Date().toISOString().split('T')[0];
  const { data: todayTransactions } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', 'gasto')
    .gte('transaction_date', today);

  const todayTotal = todayTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  if (todayTotal >= settings.daily_spending_limit) {
    await supabase.functions.invoke('send-proactive-message', {
      body: {
        userId,
        type: 'daily_limit_exceeded',
        data: {
          limit: settings.daily_spending_limit,
          spent: todayTotal
        }
      }
    });
  }
}
