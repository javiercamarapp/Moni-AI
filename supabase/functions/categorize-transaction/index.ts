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

    const prompt = `Categoriza esta transacción mexicana:

Descripción: "${description}"
Monto: $${amount}

CATEGORÍAS DISPONIBLES Y SUS IDs:
${categoryList}

REGLAS DE CATEGORIZACIÓN (PRIORIDAD):

1. ENTRETENIMIENTO Y ESTILO DE VIDA:
   - Cine, Cinemex, Cinepolis → SIEMPRE entretenimiento
   - Bar, Antro, Club, Discoteca → SIEMPRE entretenimiento
   - Best Buy, Apple Store → SIEMPRE entretenimiento (tecnología/electrónica)
   - Liverpool, Palacio de Hierro → entretenimiento (compras)
   
2. ALIMENTACIÓN:
   - Walmart, Soriana, Chedraui, Costco, Sam's → SIEMPRE alimentación
   - Restaurantes, Cafés, Fondas → alimentación
   - Rappi, Uber Eats, Didi Food → alimentación

3. SERVICIOS Y SUSCRIPCIONES:
   - Netflix, Spotify, Disney+, HBO, Amazon Prime → servicios
   - Telcel, Izzi, Telmex → servicios

4. VIVIENDA:
   - CFE, Luz, Agua CDMX, Gas Natural → vivienda
   - Renta, Predial → vivienda

INSTRUCCIONES:
- Lee la descripción con atención
- Si la descripción contiene alguna palabra clave de arriba, usa ESA categoría
- Responde SOLO con el UUID (el texto entre paréntesis)
- NO uses "NO_IDENTIFICADO" para lugares conocidos como Walmart, Cine, Bar, Best Buy, Apple Store
- NO des explicaciones adicionales`;

    console.log('Consultando IA para transacción:', description);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un categorizador de transacciones. SIEMPRE debes elegir una categoría apropiada basándote en las palabras clave de la descripción. Responde SOLO con el UUID de la categoría, sin explicaciones.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
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
