import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goals } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Preparar datos de metas para el prompt
    const goalsData = goals.map((g: any) => ({
      title: g.title,
      target: g.target,
      current: g.current,
      deadline: g.deadline,
      category: g.category,
      progress: ((g.current / g.target) * 100).toFixed(1)
    }));

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'Eres Moni AI, un asistente financiero experto en ayudar a las personas a alcanzar sus metas de ahorro. Genera insights breves, motivadores y accionables en español.'
          },
          {
            role: 'user',
            content: `Basándote en estas metas: ${JSON.stringify(goalsData)}
            
Genera exactamente 4 insights diferentes. Cada insight debe ser:
- Breve (máximo 15 palabras)
- Motivador y positivo
- Accionable o informativo
- Usar emojis relevantes

Ejemplos del estilo que buscamos:
"💡 Con $500 más/sem alcanzas tu meta 3 semanas antes"
"🎯 Estás 23% más cerca que el mes pasado, ¡excelente!"
"⚡ Reduce gastos hormiga y completa en 2 meses"
"🌟 Tu meta más cercana está a solo $2,500"

Devuelve SOLO un array JSON con los 4 insights, sin texto adicional.
Formato: ["insight1", "insight2", "insight3", "insight4"]`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_insights",
              description: "Generar 4 insights sobre metas financieras",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 4,
                    maxItems: 4
                  }
                },
                required: ["insights"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_insights" } }
      }),
    });

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data, null, 2));

    let insights: string[] = [];
    
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      insights = args.insights;
    }

    // Fallback si no se generaron insights
    if (!insights || insights.length === 0) {
      insights = [
        "💡 Mantén el ritmo, vas por buen camino",
        "🎯 Cada ahorro te acerca más a tu meta",
        "⚡ Pequeños pasos, grandes logros",
        "🌟 Tu esfuerzo vale la pena"
      ];
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      insights: [
        "💡 Mantén el ritmo, vas por buen camino",
        "🎯 Cada ahorro te acerca más a tu meta",
        "⚡ Pequeños pasos, grandes logros",
        "🌟 Tu esfuerzo vale la pena"
      ]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
