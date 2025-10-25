import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener el usuario autenticado
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    console.log('Categorizando transacciones existentes para usuario:', user.id);

    // Obtener transacciones sin categorizar (solo gastos del mes actual)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, description, amount, transaction_date, type')
      .eq('user_id', user.id)
      .eq('type', 'gasto')
      .is('category_id', null)
      .gte('transaction_date', firstDay.toISOString().split('T')[0])
      .lte('transaction_date', lastDay.toISOString().split('T')[0])
      .limit(50); // Procesar máximo 50 a la vez

    if (txError) throw txError;

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No hay transacciones sin categorizar',
          categorized: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Encontradas ${transactions.length} transacciones sin categorizar`);

    let categorizedCount = 0;

    // Categorizar cada transacción (máximo 10 en paralelo)
    const batchSize = 10;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (transaction) => {
          try {
            console.log(`Categorizando: ${transaction.description}`);
            
            const { error: categorizeError } = await supabase.functions.invoke('categorize-transaction', {
              body: {
                transactionId: transaction.id,
                userId: user.id,
                description: transaction.description,
                amount: transaction.amount,
                type: transaction.type
              }
            });

            if (categorizeError) {
              console.error(`Error categorizando ${transaction.id}:`, categorizeError);
            } else {
              categorizedCount++;
              console.log(`✓ Categorizada: ${transaction.description}`);
            }
          } catch (error) {
            console.error(`Error procesando ${transaction.id}:`, error);
          }
        })
      );

      // Pequeña pausa entre lotes para no saturar
      if (i + batchSize < transactions.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Total categorizadas: ${categorizedCount} de ${transactions.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${categorizedCount} transacciones categorizadas exitosamente`,
        total: transactions.length,
        categorized: categorizedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en categorize-existing-transactions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
