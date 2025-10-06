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
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
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
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          savingsRate: 0,
          liquidityMonths: 0,
          cashFlowAccumulated: 0,
          fixedExpenses: 0,
          variableExpenses: 0,
          fixedExpensesPercentage: 0,
          variableExpensesPercentage: 0,
          avgDailyExpense: 0,
          projectedAnnualSavings: 0,
          savingsGrowthRate: 0,
          avgGoalCompletion: 0,
          consistencyScore: 0,
          impulsivePurchases: 0,
          scoreMoni: 0,
          mindfulSpendingIndex: 0,
          scoreComponents: {
            savingsAndLiquidity: 0,
            debt: 0,
            control: 0,
            growth: 0,
            behavior: 0
          }
        },
        topCategories: [],
        projections: {
          expenses: 0,
          income: 0,
          balance: 0,
          period: period === 'year' ? 'Anual' : 'Mensual'
        },
        dailyCashFlow: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. LIQUIDEZ Y ESTABILIDAD
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
    
    // Liquidez disponible (meses que puedes vivir sin ingresos)
    const monthlyExpenses = totalExpenses;
    const liquidityMonths = monthlyExpenses > 0 ? (balance / monthlyExpenses) : 0;
    
    // Cash Flow acumulado
    const cashFlowAccumulated = balance;
    
    // 2. GASTOS Y CONSUMO
    const fixedExpenses = transactions
      .filter(t => t.type === 'expense' && t.frequency && t.frequency !== 'once')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const variableExpenses = totalExpenses - fixedExpenses;
    const fixedExpensesPercentage = totalExpenses > 0 ? (fixedExpenses / totalExpenses * 100) : 0;
    const variableExpensesPercentage = totalExpenses > 0 ? (variableExpenses / totalExpenses * 100) : 0;
    
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const daysInPeriod = 30;
    const avgDailyExpense = totalExpenses / daysInPeriod;
    
    // 3. AHORRO E INVERSIÓN
    const projectedAnnualSavings = balance * 12;
    const savingsGrowthRate = savingsRate;
    
    // 4. INDICADORES DE METAS
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);
    
    const goalsProgress = goals?.map(goal => ({
      title: goal.title,
      progress: goal.target > 0 ? (goal.current / goal.target * 100) : 0,
      current: goal.current,
      target: goal.target
    })) || [];
    
    const avgGoalCompletion = goalsProgress.length > 0 
      ? goalsProgress.reduce((sum, g) => sum + g.progress, 0) / goalsProgress.length 
      : 0;
    
    // 5. COMPORTAMIENTO
    const consistencyScore = expenseTransactions.length > 0 ? 
      Math.min(100, (expenseTransactions.filter(t => Number(t.amount) < avgDailyExpense * 1.5).length / expenseTransactions.length) * 100) 
      : 0;
    
    // Detectar gastos impulsivos (>2x el promedio)
    const impulsivePurchases = expenseTransactions.filter(t => Number(t.amount) > avgDailyExpense * 2).length;
    
    // 6. SCORE MONI (0-100) - Ponderado
    let scoreMoni = 0;
    
    // Ahorro y liquidez (30%)
    const savingsComponent = Math.min(30, (savingsRate / 20) * 30);
    const liquidityComponent = Math.min(30, liquidityMonths * 10);
    scoreMoni += (savingsComponent + liquidityComponent) / 2;
    
    // Endeudamiento (20%) - Por ahora asumimos 0 deuda = 20 puntos
    const debtComponent = 20;
    scoreMoni += debtComponent;
    
    // Gasto y control (20%)
    const controlComponent = Math.min(20, (100 - fixedExpensesPercentage) / 5);
    scoreMoni += controlComponent;
    
    // Crecimiento (15%)
    const growthComponent = Math.min(15, (savingsRate / 20) * 15);
    scoreMoni += growthComponent;
    
    // Comportamiento (15%)
    const behaviorComponent = Math.min(15, (consistencyScore / 100) * 15);
    scoreMoni += behaviorComponent;
    
    scoreMoni = Math.round(Math.min(100, scoreMoni));
    
    // 7. MINDFUL SPENDING INDEX
    const transactionCount = expenseTransactions.length;
    const avgExpensePerTransaction = transactionCount > 0 ? totalExpenses / transactionCount : 0;
    const mindfulSpendingIndex = Math.min(100, Math.max(0, 
      100 - (avgExpensePerTransaction / 100) + (savingsRate / 2)
    ));

    // Agrupar por categoría
    const expensesByCategory: Record<string, number> = {};
    expenseTransactions.forEach(t => {
      const category = t.categories?.name || 'Sin categoría';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(t.amount);
    });

    const topCategories = Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, total]) => ({
        name,
        total,
        percentage: (total / totalExpenses * 100).toFixed(1)
      }));

    // Cash Flow Diario
    const dailyCashFlowMap: Record<string, { income: number; expenses: number; balance: number }> = {};
    transactions.forEach(t => {
      const date = t.transaction_date;
      if (!dailyCashFlowMap[date]) {
        dailyCashFlowMap[date] = { income: 0, expenses: 0, balance: 0 };
      }
      if (t.type === 'income') {
        dailyCashFlowMap[date].income += Number(t.amount);
      } else {
        dailyCashFlowMap[date].expenses += Number(t.amount);
      }
      dailyCashFlowMap[date].balance = dailyCashFlowMap[date].income - dailyCashFlowMap[date].expenses;
    });

    const dailyCashFlow = Object.entries(dailyCashFlowMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
        amount: data.balance
      }));

    const metrics = {
      // Liquidez y Estabilidad
      totalIncome,
      totalExpenses,
      balance,
      savingsRate: Math.round(savingsRate * 100) / 100,
      liquidityMonths: Math.round(liquidityMonths * 100) / 100,
      cashFlowAccumulated,
      
      // Gastos y Consumo
      fixedExpenses,
      variableExpenses,
      fixedExpensesPercentage: Math.round(fixedExpensesPercentage * 100) / 100,
      variableExpensesPercentage: Math.round(variableExpensesPercentage * 100) / 100,
      avgDailyExpense: Math.round(avgDailyExpense),
      
      // Ahorro e Inversión
      projectedAnnualSavings: Math.round(projectedAnnualSavings),
      savingsGrowthRate: Math.round(savingsGrowthRate * 100) / 100,
      
      // Metas y Comportamiento
      avgGoalCompletion: Math.round(avgGoalCompletion),
      consistencyScore: Math.round(consistencyScore),
      impulsivePurchases,
      
      // Score Moni y salud financiera
      scoreMoni,
      mindfulSpendingIndex: Math.round(mindfulSpendingIndex),
      
      // Componentes del Score (para visualización radar)
      scoreComponents: {
        savingsAndLiquidity: Math.round((savingsComponent + liquidityComponent) / 2),
        debt: debtComponent,
        control: Math.round(controlComponent),
        growth: Math.round(growthComponent),
        behavior: Math.round(behaviorComponent)
      }
    };

    // Generar AI insights usando Lovable AI
    const aiPrompt = `Eres Moni, un coach financiero de clase mundial. Analiza estos datos financieros del usuario:

📊 PERIODO: ${period}

💰 LIQUIDEZ Y ESTABILIDAD:
- Ingresos: $${totalIncome.toLocaleString()}
- Gastos: $${totalExpenses.toLocaleString()}
- Balance: $${balance.toLocaleString()}
- Tasa de ahorro: ${savingsRate.toFixed(1)}%
- Liquidez disponible: ${liquidityMonths.toFixed(1)} meses

💸 GASTOS Y CONSUMO:
- Gastos fijos: $${fixedExpenses.toLocaleString()} (${fixedExpensesPercentage.toFixed(1)}%)
- Gastos variables: $${variableExpenses.toLocaleString()} (${variableExpensesPercentage.toFixed(1)}%)
- Gasto promedio diario: $${avgDailyExpense.toLocaleString()}
- Compras impulsivas detectadas: ${impulsivePurchases}

🎯 METAS Y COMPORTAMIENTO:
- Cumplimiento promedio de metas: ${avgGoalCompletion.toFixed(1)}%
- Índice de consistencia: ${consistencyScore.toFixed(1)}/100
- Score Moni: ${scoreMoni}/100

📈 Top 5 categorías de gasto:
${topCategories.map((c, i) => `${i + 1}. ${c.name}: $${Number(c.total).toLocaleString()} (${c.percentage}%)`).join('\n')}

Genera un análisis financiero de clase mundial que incluya:

1. **Resumen Ejecutivo** (3-4 frases): Evalúa la salud financiera general del usuario.

2. **Análisis de Liquidez**: ¿Qué tan preparado está para imprevistos? ¿Debería aumentar su fondo de emergencia?

3. **Análisis de Gastos**: Identifica patrones, fugas de dinero, y oportunidades de optimización.

4. **Score Moni Desglosado**: Explica brevemente por qué tiene ese puntaje y qué componente puede mejorar más fácilmente.

5. **3 Recomendaciones Accionables**: Específicas, priorizadas y realistas.

6. **Proyección y Motivación**: Si continúa así, ¿dónde estará en 6 meses? Mensaje motivacional.

Sé conversacional, empático, y usa emojis moderadamente. Habla como un verdadero coach financiero profesional.`;

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
            content: 'Eres Moni, un coach financiero de clase mundial con inteligencia emocional excepcional.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ]
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
    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const avgDailyExpenses = totalExpenses / daysElapsed;
    const avgDailyIncome = totalIncome / daysElapsed;
    
    const projectionDays = period === 'year' ? 365 : 30;
    const projectedExpenses = avgDailyExpenses * projectionDays;
    const projectedIncome = avgDailyIncome * projectionDays;
    const projectedBalance = projectedIncome - projectedExpenses;

    return new Response(JSON.stringify({
      analysis,
      metrics,
      topCategories,
      projections: {
        expenses: Math.round(projectedExpenses),
        income: Math.round(projectedIncome),
        balance: Math.round(projectedBalance),
        period: projectionDays === 365 ? 'Anual' : 'Mensual'
      },
      dailyCashFlow
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