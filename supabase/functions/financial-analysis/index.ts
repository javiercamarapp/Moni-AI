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

    // Calcular métricas básicas
    const ingresos = transactions.filter(t => t.type === 'ingreso');
    const gastos = transactions.filter(t => t.type === 'gasto');
    
    const totalIngresos = ingresos.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalGastos = gastos.reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = totalIngresos - totalGastos;
    const tasaAhorro = totalIngresos > 0 ? (balance / totalIngresos) * 100 : 0;

    // Cash Flow Diario
    const cashFlowDiario: Record<string, { ingresos: number; gastos: number; balance: number }> = {};
    transactions.forEach(t => {
      const fecha = t.transaction_date;
      if (!cashFlowDiario[fecha]) {
        cashFlowDiario[fecha] = { ingresos: 0, gastos: 0, balance: 0 };
      }
      if (t.type === 'ingreso') {
        cashFlowDiario[fecha].ingresos += Number(t.amount);
      } else {
        cashFlowDiario[fecha].gastos += Number(t.amount);
      }
      cashFlowDiario[fecha].balance = cashFlowDiario[fecha].ingresos - cashFlowDiario[fecha].gastos;
    });

    // Score Moni (0-100)
    const scoreMoni = Math.min(100, Math.max(0, 
      (tasaAhorro > 0 ? 30 : 0) + // 30 pts si ahorra
      (tasaAhorro > 20 ? 20 : tasaAhorro) + // 20 pts por tasa de ahorro
      (transactions.length > 0 ? 20 : 0) + // 20 pts por registrar transacciones
      (balance > 0 ? 30 : Math.max(0, 30 + (balance / 1000) * 10)) // 30 pts por balance positivo
    ));

    // Ratio de liquidez (cuántos meses puede sobrevivir con balance actual)
    const ratioLiquidez = totalGastos > 0 ? balance / totalGastos : 0;

    // Ahorro proyectado anual
    const diasTranscurridos = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const ahorroDiarioPromedio = balance / diasTranscurridos;
    const ahorroProyectadoAnual = ahorroDiarioPromedio * 365;

    // Agrupar por categoría
    const gastosPorCategoria: Record<string, number> = {};
    gastos.forEach(t => {
      const categoria = t.categories?.name || 'Sin categoría';
      gastosPorCategoria[categoria] = (gastosPorCategoria[categoria] || 0) + Number(t.amount);
    });

    const categoriasMasGasto = Object.entries(gastosPorCategoria)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Gastos recurrentes (transacciones con montos similares)
    const gastosRecurrentes = gastos.filter((g, i, arr) => 
      arr.filter(g2 => Math.abs(Number(g.amount) - Number(g2.amount)) < 50 && g.id !== g2.id).length > 0
    ).length;

    // Mindful Spending Index (0-100) - gastos conscientes vs impulsivos
    const gastosFinDeSemana = gastos.filter(g => {
      const dia = new Date(g.transaction_date).getDay();
      return dia === 0 || dia === 6;
    }).length;
    const mindfulIndex = Math.max(0, 100 - (gastosFinDeSemana / gastos.length) * 100);

    // Usar Lovable AI para análisis inteligente
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const contextForAI = `
Período: ${period === 'month' ? 'Este mes' : period === 'year' ? 'Este año' : 'Últimos 30 días'}

📊 Métricas Financieras:
Total ingresos: $${totalIngresos.toFixed(2)}
Total gastos: $${totalGastos.toFixed(2)}
Balance: $${balance.toFixed(2)}
Tasa de ahorro: ${tasaAhorro.toFixed(1)}%
Score Moni: ${scoreMoni.toFixed(0)}/100
Ratio de liquidez: ${ratioLiquidez.toFixed(2)} meses
Ahorro proyectado anual: $${ahorroProyectadoAnual.toFixed(2)}

🧠 Comportamiento:
Gastos recurrentes detectados: ${gastosRecurrentes}
Mindful Spending Index: ${mindfulIndex.toFixed(0)}/100
Gastos en fin de semana: ${gastosFinDeSemana}

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
            content: `Eres Moni, un coach financiero amigable y motivador con inteligencia emocional. 

Analiza los datos financieros del usuario y proporciona:

1. Una evaluación honesta pero motivadora de su Score Moni y salud financiera
2. Insights específicos sobre patrones de gasto (especialmente gastos de fin de semana o emocionales)
3. Reconocimiento de logros (aunque sean pequeños)
4. 2-3 "Smart Nudges" - micro-recomendaciones accionables inmediatas
5. Una proyección optimista pero realista si continúa con buenos hábitos

Tono: Natural, cercano, sin ser condescendiente. Como un amigo que te apoya.
Usa emojis estratégicamente (no exageres).
Menciona el Score Moni como "tu salud financiera" de forma positiva.
Si detectas gastos recurrentes altos o bajo Mindful Index, ofrece alternativas amables.`
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

    // Calcular proyecciones
    const gastoPromedioDiario = totalGastos / diasTranscurridos;
    const ingresoPromedioDiario = totalIngresos / diasTranscurridos;
    
    const diasProyeccion = period === 'year' ? 365 : 30;
    const proyeccionGastos = gastoPromedioDiario * diasProyeccion;
    const proyeccionIngresos = ingresoPromedioDiario * diasProyeccion;
    const proyeccionBalance = proyeccionIngresos - proyeccionGastos;

    // Preparar datos de cash flow para gráfica
    const cashFlowArray = Object.entries(cashFlowDiario)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([fecha, data]) => ({
        fecha: new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
        ingresos: data.ingresos,
        gastos: data.gastos,
        balance: data.balance
      }));

    return new Response(JSON.stringify({
      analysis,
      metrics: {
        totalIngresos,
        totalGastos,
        balance,
        tasaAhorro: Number(tasaAhorro.toFixed(1)),
        transaccionesCount: transactions.length,
        scoreMoni: Number(scoreMoni.toFixed(0)),
        ratioLiquidez: Number(ratioLiquidez.toFixed(2)),
        ahorroProyectadoAnual: Number(ahorroProyectadoAnual.toFixed(2)),
        gastosRecurrentes,
        mindfulIndex: Number(mindfulIndex.toFixed(0))
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
      },
      cashFlow: cashFlowArray.slice(-14) // Últimos 14 días
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
