import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Fetching transactions for user:', user.id);

    // Fetch all user transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(200);

    if (txError) {
      console.error('Error fetching transactions:', txError);
      throw txError;
    }

    console.log('Found transactions:', transactions?.length || 0);

    // Prepare data for AI analysis
    const transactionSummary = transactions?.map(tx => ({
      date: tx.transaction_date,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category: tx.category_id
    })) || [];

    const systemPrompt = `Eres un asistente financiero experto en análisis de patrones de gastos e ingresos.
Analiza las transacciones históricas del usuario y predice los próximos movimientos que tendrá en los próximos 60 días.

Considera:
- Patrones recurrentes (salarios mensuales, quincenales)
- Gastos fijos (rentas, suscripciones)
- Gastos variables pero predecibles (alimentos, transporte)
- Fechas probables basadas en el historial
- Montos aproximados basados en promedios

IMPORTANTE: Devuelve EXACTAMENTE un array JSON válido con esta estructura:
[
  {
    "date": "2025-02-15",
    "type": "ingreso",
    "description": "Salario quincenal",
    "amount": 15000,
    "confidence": "high"
  }
]

- date: formato YYYY-MM-DD
- type: "ingreso" o "gasto"
- description: descripción clara del movimiento
- amount: monto en número
- confidence: "high", "medium", o "low"

Devuelve entre 10-30 predicciones ordenadas por fecha.`;

    const userPrompt = `Analiza estas transacciones históricas y predice los próximos movimientos:

${JSON.stringify(transactionSummary, null, 2)}

Fecha actual: ${new Date().toISOString().split('T')[0]}`;

    console.log('Calling Lovable AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const aiContent = aiData.choices[0].message.content;
    
    // Extract JSON from AI response (it might be wrapped in markdown code blocks)
    let predictions = [];
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        predictions = JSON.parse(jsonMatch[0]);
      } else {
        predictions = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('AI content:', aiContent);
      throw new Error('Failed to parse AI predictions');
    }

    console.log('Predictions generated:', predictions.length);

    return new Response(
      JSON.stringify({ predictions }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in predict-future-transactions:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        predictions: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
