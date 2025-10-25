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
    const { transactionId, userId, description, amount, type } = await req.json();

    console.log('Categorizando transacción:', { transactionId, userId, description, amount, type });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener las categorías del usuario
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, type')
      .eq('user_id', userId)
      .is('parent_id', null);

    if (catError) {
      console.error('Error obteniendo categorías:', catError);
      throw catError;
    }

    // Buscar o crear categoría de "Gastos no identificados"
    let unidentifiedCategory = categories?.find(c => 
      c.name.toLowerCase() === 'gastos no identificados' && c.type === 'gasto'
    );

    if (!unidentifiedCategory && type === 'gasto') {
      console.log('Creando categoría "Gastos no identificados"');
      const { data: newCat, error: createError } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: 'Gastos no identificados',
          type: 'gasto',
          color: 'bg-gray-500/20'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creando categoría no identificados:', createError);
      } else {
        unidentifiedCategory = newCat;
        console.log('Categoría "Gastos no identificados" creada:', unidentifiedCategory.id);
      }
    }

    // Filtrar categorías según el tipo de transacción
    const availableCategories = categories?.filter(c => c.type === type) || [];
    
    if (availableCategories.length === 0) {
      console.log('No hay categorías disponibles para tipo:', type);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No hay categorías disponibles',
          categoryId: null 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Listar las 12 categorías principales para la IA (excluyendo gastos no identificados)
    const categoryList = availableCategories
      .filter(c => c.name.toLowerCase() !== 'gastos no identificados')
      .map(c => `- ${c.name} (ID: ${c.id})`)
      .join('\n');

    const prompt = `Analiza esta transacción y asígnala a la categoría más apropiada de las disponibles:

Descripción: ${description}
Monto: $${amount}
Tipo: ${type}

Categorías disponibles:
${categoryList}

EJEMPLOS DE CATEGORIZACIÓN (usa las categorías disponibles arriba):
- Walmart, Soriana, Chedraui, mercado, supermercado → Alimentación
- Antro, bar, cine, cinemex, cinepolis, teatro, concierto, Best Buy, Apple Store → Servicios y suscripciones
- Spotify, Netflix, Disney+, Amazon Prime → Servicios y suscripciones
- Uber, taxi, gasolina, estacionamiento → Transporte
- Luz, agua, gas, internet, teléfono → Servicios y suscripciones
- Gimnasio, doctor, farmacia, hospital → Salud y bienestar

INSTRUCCIONES CRÍTICAS:
1. SOLO puedes usar las categorías listadas arriba con sus IDs
2. Si encuentras una categoría apropiada, responde SOLO con su ID exacto (el UUID entre paréntesis)
3. Si NO hay ninguna categoría apropiada en la lista, responde: "NO_IDENTIFICADO"
4. NO inventes categorías que no estén en la lista
5. NO des explicaciones
6. Responde SOLO con el ID o "NO_IDENTIFICADO"`;

    console.log('Consultando IA para transacción:', description);

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
            content: 'Eres un experto en finanzas personales. Categoriza transacciones usando el sentido común basándote en el nombre del establecimiento o descripción. Solo usa "NO_IDENTIFICADO" cuando realmente no hay ninguna categoría apropiada.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Error de IA:', errorText);
      throw new Error(`AI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiResult = aiData.choices[0].message.content.trim();

    console.log('Respuesta de IA:', aiResult);

    let categoryId: string | null = null;

    if (aiResult === 'NO_IDENTIFICADO' || !availableCategories.some(c => c.id === aiResult)) {
      // Usar categoría de gastos no identificados
      if (unidentifiedCategory) {
        categoryId = unidentifiedCategory.id;
        console.log('Asignado a "Gastos no identificados"');
      } else {
        console.log('No se pudo asignar categoría');
      }
    } else {
      // Usar la categoría sugerida por la IA
      categoryId = aiResult;
      console.log('Asignado a categoría:', categoryId);
    }

    // Actualizar la transacción
    if (categoryId) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ category_id: categoryId })
        .eq('id', transactionId);

      if (updateError) {
        console.error('Error actualizando transacción:', updateError);
        throw updateError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        categoryId,
        wasIdentified: aiResult !== 'NO_IDENTIFICADO'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en categorize-transaction:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
