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
    const { monthlyIncome, monthlyExpenses, daysIntoMonth, daysInMonth } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const budget = monthlyIncome * 0.8;
    const percentageSpent = (monthlyExpenses / budget) * 100;
    const percentageOfMonthPassed = (daysIntoMonth / daysInMonth) * 100;
    const expectedSpending = (percentageOfMonthPassed / 100) * budget;
    const isOnTrack = monthlyExpenses <= expectedSpending;

    const prompt = `Analiza este patrón de gastos mensual y responde SOLO con UNA de estas tres frases exactas:

1. "Dentro del presupuesto del mes" - si el patrón es bueno
2. "Se debe de ahorrar un poco más" - si el patrón es intermedio
3. "Hay que mejorar o no lograremos el presupuesto del mensual" - si el patrón es malo

DATOS:
- Presupuesto mensual: $${budget.toFixed(2)}
- Gastado hasta ahora: $${monthlyExpenses.toFixed(2)} (${percentageSpent.toFixed(1)}% del presupuesto)
- Días transcurridos del mes: ${daysIntoMonth} de ${daysInMonth} (${percentageOfMonthPassed.toFixed(1)}%)
- Gasto esperado a esta altura: $${expectedSpending.toFixed(2)}
- ¿Va bien? ${isOnTrack ? 'Sí' : 'No'}

CRITERIOS:
- BUENO: Si el gasto actual es menor o igual al gasto esperado según los días transcurridos
- INTERMEDIO: Si se está gastando un poco más de lo esperado pero aún es recuperable
- MALO: Si se está gastando mucho más de lo esperado y difícilmente se cumplirá el presupuesto

Responde ÚNICAMENTE con una de las tres frases exactas.`;

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
            content: 'Eres un asistente financiero experto. Responde SOLO con la frase exacta solicitada, sin explicaciones adicionales.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            message: "✅ Dentro del presupuesto del mes",
            error: "Rate limit exceeded" 
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            message: "✅ Dentro del presupuesto del mes",
            error: "Payment required" 
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let message = data.choices?.[0]?.message?.content?.trim() || "Dentro del presupuesto del mes";

    // Asegurar que la respuesta sea una de las tres frases exactas
    if (!message.includes("Dentro del presupuesto del mes") && 
        !message.includes("Se debe de ahorrar un poco más") && 
        !message.includes("Hay que mejorar o no lograremos el presupuesto del mensual")) {
      // Fallback basado en lógica simple
      if (isOnTrack && percentageSpent < 70) {
        message = "Dentro del presupuesto del mes";
      } else if (percentageSpent > 90 || (monthlyExpenses > expectedSpending * 1.3)) {
        message = "Hay que mejorar o no lograremos el presupuesto del mensual";
      } else {
        message = "Se debe de ahorrar un poco más";
      }
    }

    // Agregar emoji según el mensaje
    let icon = "✅";
    if (message.includes("Hay que mejorar")) {
      icon = "⚠️";
    } else if (message.includes("Se debe de ahorrar")) {
      icon = "⚡";
    }

    return new Response(
      JSON.stringify({ message: `${icon} ${message}` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-budget function:', error);
    return new Response(
      JSON.stringify({ 
        message: "✅ Dentro del presupuesto del mes",
        error: error.message 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
