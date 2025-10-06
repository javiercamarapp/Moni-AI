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
    const { description, amount, type, userId, merchantName } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener categorías del usuario
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, type')
      .eq('user_id', userId)
      .eq('type', type);

    const categoriesInfo = categories?.map(c => c.name).join(', ') || 'ninguna';

    // Usar IA para categorizar
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente que categoriza transacciones financieras.

Categorías disponibles del usuario: ${categoriesInfo}

Basándote en la descripción y el comercio, elige la categoría más apropiada.
Si ninguna aplica, sugiere una nueva categoría.

Responde SOLO con un JSON:
{
  "category": "nombre de categoría existente o nueva",
  "confidence": "high" | "medium" | "low",
  "reason": "breve explicación"
}`
          },
          {
            role: 'user',
            content: `Transacción: "${description}"${merchantName ? `\nComerciante: "${merchantName}"` : ''}\nMonto: $${amount}`
          }
        ],
        temperature: 0.2
      })
    });

    if (!aiResponse.ok) {
      throw new Error('AI API error');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response');
    }
    
    const categorization = JSON.parse(jsonMatch[0]);

    // Buscar categoría existente
    let categoryId = null;
    if (categories) {
      const matchedCategory = categories.find(c => 
        c.name.toLowerCase() === categorization.category.toLowerCase()
      );
      
      if (matchedCategory) {
        categoryId = matchedCategory.id;
      } else {
        // Crear nueva categoría
        const { data: newCategory } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: categorization.category,
            type,
            color: type === 'ingreso' ? 'bg-primary/20' : 'bg-destructive/20'
          })
          .select()
          .single();
        
        if (newCategory) {
          categoryId = newCategory.id;
        }
      }
    }

    return new Response(JSON.stringify({
      categoryId,
      categoryName: categorization.category,
      confidence: categorization.confidence,
      reason: categorization.reason
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Categorization error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
