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

    // Verificar autenticación
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Recategorizando gastos no identificados para usuario:', user.id);

    // Obtener todas las transacciones marcadas como "Gastos no identificados"
    const { data: unidentifiedCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Gastos no identificados')
      .eq('type', 'gasto')
      .single();

    if (!unidentifiedCategory) {
      return new Response(
        JSON.stringify({ success: true, message: 'No hay categoría de gastos no identificados' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener transacciones del mes actual que están en "Gastos no identificados"
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, description, amount')
      .eq('user_id', user.id)
      .eq('category_id', unidentifiedCategory.id)
      .eq('type', 'gasto')
      .gte('transaction_date', firstDayOfMonth.toISOString().split('T')[0])
      .lte('transaction_date', lastDayOfMonth.toISOString().split('T')[0]);

    if (txError) throw txError;

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No hay transacciones no identificadas para recategorizar', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Encontradas ${transactions.length} transacciones para recategorizar`);

    // Recategorizar cada transacción usando la función de categorización
    let recategorized = 0;
    for (const transaction of transactions) {
      try {
        console.log(`Recategorizando: ${transaction.description} ($${transaction.amount})`);
        
        const { error: categorizeError } = await supabase.functions.invoke('categorize-transaction', {
          body: {
            transactionId: transaction.id,
            userId: user.id,
            description: transaction.description,
            amount: transaction.amount,
            type: 'gasto'
          }
        });

        if (categorizeError) {
          console.error(`Error categorizando ${transaction.description}:`, categorizeError);
        } else {
          recategorized++;
        }
      } catch (error) {
        console.error(`Error procesando transacción ${transaction.id}:`, error);
      }
    }

    console.log(`Recategorizadas ${recategorized} de ${transactions.length} transacciones`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Se recategorizaron ${recategorized} transacciones`,
        total: transactions.length,
        recategorized 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en recategorize-unidentified:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
