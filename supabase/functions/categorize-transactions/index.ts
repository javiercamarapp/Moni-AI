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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener el usuario autenticado
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    console.log('Categorizando transacciones para usuario:', user.id);

    // Obtener transacciones sin categorizar del mes actual
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, description, amount, transaction_date, type')
      .eq('user_id', user.id)
      .is('category_id', null)
      .gte('transaction_date', firstDay.toISOString().split('T')[0])
      .lte('transaction_date', lastDay.toISOString().split('T')[0]);

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

    // Obtener las categorías principales del usuario
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, type')
      .eq('user_id', user.id)
      .is('parent_id', null);

    if (catError) throw catError;

    if (!categories || categories.length === 0) {
      throw new Error('No se encontraron categorías para el usuario');
    }

    console.log(`Usando ${categories.length} categorías principales`);

    // Categorías de gastos para la IA
    const expenseCategories = categories
      .filter(c => c.type === 'gasto')
      .map(c => `- ${c.name} (ID: ${c.id})`);

    // Categorías de ingresos para la IA
    const incomeCategories = categories
      .filter(c => c.type === 'ingreso')
      .map(c => `- ${c.name} (ID: ${c.id})`);

    let categorizedCount = 0;

    // Categorizar cada transacción
    for (const transaction of transactions) {
      try {
        const availableCategories = transaction.type === 'gasto' 
          ? expenseCategories 
          : incomeCategories;

        if (availableCategories.length === 0) {
          console.log(`No hay categorías disponibles para tipo: ${transaction.type}`);
          continue;
        }

        const prompt = `Analiza esta transacción y asigna la categoría más apropiada:

Descripción: ${transaction.description}
Monto: $${transaction.amount}
Fecha: ${transaction.transaction_date}
Tipo: ${transaction.type}

Categorías disponibles:
${availableCategories.join('\n')}

Responde SOLO con el ID de la categoría (el texto entre paréntesis). No agregues ninguna otra explicación.`;

        console.log(`Categorizando: ${transaction.description}`);

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'Eres un experto en finanzas personales que categoriza transacciones. Responde solo con el ID de la categoría, sin explicaciones adicionales.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`Error de IA para transacción ${transaction.id}:`, errorText);
          continue;
        }

        const aiData = await aiResponse.json();
        const categoryId = aiData.choices[0].message.content.trim();

        console.log(`IA sugirió categoría: ${categoryId} para "${transaction.description}"`);

        // Verificar que el categoryId sea válido
        const isValidCategory = categories.some(c => c.id === categoryId);
        
        if (!isValidCategory) {
          console.log(`Categoría inválida: ${categoryId}`);
          continue;
        }

        // Actualizar la transacción con la categoría asignada
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ category_id: categoryId })
          .eq('id', transaction.id);

        if (updateError) {
          console.error(`Error actualizando transacción ${transaction.id}:`, updateError);
          continue;
        }

        categorizedCount++;
        console.log(`✓ Transacción ${transaction.id} categorizada exitosamente`);

      } catch (error) {
        console.error(`Error procesando transacción ${transaction.id}:`, error);
        continue;
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
    console.error('Error en categorize-transactions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
