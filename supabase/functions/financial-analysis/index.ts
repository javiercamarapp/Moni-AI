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
    const { userId, period = 'month' } = await req.json();
    
    console.log('Generating financial analysis for user:', userId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calcular fechas según el período
    const now = new Date();
    let startDate: Date;
    
    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // último mes
    }

    // Obtener transacciones del período
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, categories(name, type)')
      .eq('user_id', userId)
      .gte('transaction_date', startDate.toISOString().split('T')[0])
      .order('transaction_date', { ascending: false });

    if (!transactions || transactions.length === 0) {
      return new Response(JSON.stringify({
        analysis: 'No hay transacciones en este período para analizar. ¡Comienza a registrar tus ingresos y gastos para obtener insights personalizados! 💪',
        metrics: {
          totalIngresos: 0,
          totalGastos: 0,
          balance: 0,
          tasaAhorro: 0,
          transaccionesCount: 0
        },
        topCategories: [],
        projections: {
          gastos: 0,
          ingresos: 0,
          balance: 0,
          period: period === 'year' ? 'Anual' : 'Mensual'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calcular métricas
    const ingresos = transactions.filter(t => t.type === 'ingreso');
    const gastos = transactions.filter(t => t.type === 'gasto');
    
    const totalIngresos = ingresos.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalGastos = gastos.reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = totalIngresos - totalGastos;

    // Agrupar por categoría
    const gastosPorCategoria: Record<string, number> = {};
    gastos.forEach(t => {
      const categoria = t.categories?.name || 'Sin categoría';
      gastosPorCategoria[categoria] = (gastosPorCategoria[categoria] || 0) + Number(t.amount);
    });

    const categoriasMasGasto = Object.entries(gastosPorCategoria)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Usar Lovable AI para análisis inteligente
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const contextForAI = `
Período: ${period === 'month' ? 'Este mes' : period === 'year' ? 'Este año' : 'Últimos 30 días'}
Total ingresos: $${totalIngresos.toFixed(2)}
Total gastos: $${totalGastos.toFixed(2)}
Balance: $${balance.toFixed(2)}

Top 5 categorías de gasto:
${categoriasMasGasto.map(([cat, amount], i) => `${i + 1}. ${cat}: $${amount.toFixed(2)}`).join('\n')}

Últimas 10 transacciones:
${transactions.slice(0, 10).map(t => 
  `- ${t.type === 'ingreso' ? '💰' : '💸'} $${t.amount} - ${t.description} (${t.categories?.name || 'Sin categoría'})`
).join('\n')}
`;

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
            content: `Eres Moni, un coach financiero amigable y motivador. Analiza los datos financieros del usuario y proporciona:

1. Un análisis breve y motivador de su situación financiera actual
2. 3-5 insights específicos y accionables sobre sus hábitos de gasto
3. Proyecciones realistas para el próximo mes basadas en sus patrones
4. Recomendaciones personalizadas para mejorar su salud financiera

Usa emojis para hacer el mensaje más amigable. Sé específico con los números y categorías.
Responde en un tono conversacional, como si estuvieras hablando con un amigo.`
          },
          {
            role: 'user',
            content: `Analiza mi situación financiera:\n\n${contextForAI}`
          }
        ],
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0].message.content;

    // Calcular proyecciones simples
    const diasTranscurridos = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const gastoPromedioDiario = totalGastos / diasTranscurridos;
    const ingresoPromedioDiario = totalIngresos / diasTranscurridos;
    
    const diasProyeccion = period === 'year' ? 365 : 30;
    const proyeccionGastos = gastoPromedioDiario * diasProyeccion;
    const proyeccionIngresos = ingresoPromedioDiario * diasProyeccion;
    const proyeccionBalance = proyeccionIngresos - proyeccionGastos;

    return new Response(JSON.stringify({
      analysis,
      metrics: {
        totalIngresos,
        totalGastos,
        balance,
        tasaAhorro: totalIngresos > 0 ? ((balance / totalIngresos) * 100).toFixed(1) : 0,
        transaccionesCount: transactions.length
      },
      topCategories: categoriasMasGasto.map(([name, amount]) => ({
        name,
        amount: Number(amount.toFixed(2)),
        percentage: ((amount / totalGastos) * 100).toFixed(1)
      })),
      projections: {
        gastos: Number(proyeccionGastos.toFixed(2)),
        ingresos: Number(proyeccionIngresos.toFixed(2)),
        balance: Number(proyeccionBalance.toFixed(2)),
        period: diasProyeccion === 365 ? 'Anual' : 'Mensual'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Financial analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
