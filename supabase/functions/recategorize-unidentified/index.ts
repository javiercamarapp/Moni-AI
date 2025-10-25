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

    console.log('Iniciando categorización automática para usuario:', user.id);

    // Obtener categoría "Gastos no identificados"
    const { data: unidentifiedCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Gastos no identificados')
      .eq('type', 'gasto')
      .maybeSingle();

    // Obtener transacciones sin categoría o con "Gastos no identificados"
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, description, amount')
      .eq('user_id', user.id)
      .eq('type', 'gasto')
      .or(unidentifiedCategory 
        ? `category_id.is.null,category_id.eq.${unidentifiedCategory.id}`
        : `category_id.is.null`)
      .order('transaction_date', { ascending: false })
      .limit(100); // Procesar hasta 100 transacciones por vez

    if (txError) throw txError;

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No hay transacciones por categorizar', 
          count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Encontradas ${transactions.length} transacciones para categorizar`);

    // Procesar en lotes de 10 transacciones en paralelo
    const batchSize = 10;
    let recategorized = 0;
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (transaction) => {
        try {
          const { error: categorizeError } = await supabase.functions.invoke('categorize-transaction', {
            body: {
              transactionId: transaction.id,
              userId: user.id,
              description: transaction.description,
              amount: transaction.amount,
              type: 'gasto'
            }
          });

          if (!categorizeError) {
            recategorized++;
            return true;
          }
          return false;
        } catch (error) {
          console.error(`Error procesando ${transaction.description}:`, error);
          return false;
        }
      });

      await Promise.all(batchPromises);
      
      // Pequeña pausa entre lotes para no saturar
      if (i + batchSize < transactions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Categorizadas ${recategorized} de ${transactions.length} transacciones`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Se categorizaron ${recategorized} transacciones`,
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
