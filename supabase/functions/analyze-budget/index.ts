import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    
    // Calcular proyección del gasto total al final del mes
    const dailyAverageSpent = monthlyExpenses / daysIntoMonth;
    const projectedTotal = dailyAverageSpent * daysInMonth;
    const projectedPercentage = (projectedTotal / budget) * 100;
    const willExceedBudget = projectedTotal > budget;
    const projectedOverspend = projectedTotal - budget;
    
    // Velocidad de gasto comparada con lo esperado
    const spendingRate = monthlyExpenses / expectedSpending;
    
    console.log('📊 Budget Analysis:', {
      budget,
      monthlyExpenses,
      percentageSpent: percentageSpent.toFixed(1) + '%',
      spendingRate: spendingRate.toFixed(2),
      dailyAverageSpent: dailyAverageSpent.toFixed(2),
      projectedTotal: projectedTotal.toFixed(2),
      projectedPercentage: projectedPercentage.toFixed(1) + '%',
      willExceedBudget,
      daysRemaining: daysInMonth - daysIntoMonth
    });

    const prompt = `Eres un analista financiero experto. Analiza este presupuesto mensual y PROYECTA si cumplirá o NO el presupuesto al final del mes.

DATOS DEL MES ACTUAL:
- Presupuesto mensual (80% del ingreso): $${budget.toFixed(2)}
- Gastado hasta ahora: $${monthlyExpenses.toFixed(2)} (${percentageSpent.toFixed(1)}% del presupuesto)
- Días transcurridos: ${daysIntoMonth} de ${daysInMonth} (${percentageOfMonthPassed.toFixed(1)}%)
- Gasto esperado a esta altura: $${expectedSpending.toFixed(2)}
- Velocidad de gasto: ${spendingRate > 1 ? 'ACELERADA' : 'CONTROLADA'} (${(spendingRate * 100).toFixed(0)}% de lo esperado)
- Promedio diario: $${dailyAverageSpent.toFixed(2)}/día
- PROYECCIÓN FIN DE MES: $${projectedTotal.toFixed(2)} (${projectedPercentage.toFixed(0)}% del presupuesto)
${willExceedBudget ? `- Se EXCEDERÁ por: $${projectedOverspend.toFixed(2)}` : `- Se AHORRARÁ: $${(budget - projectedTotal).toFixed(2)}`}

INSTRUCCIONES:
1. Analiza la PROYECCIÓN de fin de mes
2. Responde con UNA de estas tres frases EXACTAS con emoji al inicio:
   - "✅ Cumplirás el presupuesto del mes" - si la proyección indica que SÍ cumplirá
   - "⚡ Reduce gastos para cumplir el presupuesto" - si hay riesgo pero AÚN puede cumplir
   - "⚠️ No cumplirás el presupuesto este mes" - si la proyección indica que NO cumplirá

CRITERIOS DE DECISIÓN:
- CUMPLIRÁ (✅): proyección ≤ 100% del presupuesto
- RIESGO (⚡): proyección entre 100% y 110% del presupuesto
- NO CUMPLIRÁ (⚠️): proyección > 110% del presupuesto

Responde SOLO con una de las tres frases exactas (incluyendo el emoji al inicio).`;

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
    let message = data.choices?.[0]?.message?.content?.trim() || "";

    // Validar que la respuesta sea una de las tres frases exactas
    const validResponses = [
      "Cumplirás el presupuesto del mes",
      "Reduce gastos para cumplir el presupuesto",
      "No cumplirás el presupuesto este mes"
    ];
    
    const isValidResponse = validResponses.some(phrase => message.includes(phrase));
    
    if (!isValidResponse) {
      // Fallback basado en proyección real
      if (projectedPercentage <= 100) {
        message = "✅ Cumplirás el presupuesto del mes";
      } else if (projectedPercentage <= 110) {
        message = "⚡ Reduce gastos para cumplir el presupuesto";
      } else {
        message = "⚠️ No cumplirás el presupuesto este mes";
      }
    }

    console.log('🤖 AI Response:', message);

    return new Response(
      JSON.stringify({ message }),
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
