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
    
    // Liquidez inmediata (meses que puedes vivir sin ingresos)
    const monthlyExpenses = totalExpenses;
    const liquidityMonths = monthlyExpenses > 0 ? (balance / monthlyExpenses) : 0;
    
    // Coeficiente de liquidez (activos líquidos / pasivos corto plazo)
    // Asumimos balance como activos líquidos y gastos mensuales como pasivos
    const liquidityCoefficient = monthlyExpenses > 0 ? (balance / monthlyExpenses) : 0;
    
    // Cash Flow acumulado
    const cashFlowAccumulated = balance;
    
    // 2. ENDEUDAMIENTO (simulado - idealmente vendrá de tabla de deudas)
    // Por ahora usamos 0, pero preparamos la estructura
    const totalDebt = 0; // TODO: obtener de tabla deudas
    const monthlyDebtPayment = 0; // TODO: obtener de tabla deudas
    const monthlyInterestPaid = 0; // TODO: obtener de tabla deudas
    
    // Razón de endeudamiento total (deuda / activos)
    const totalAssets = balance > 0 ? balance : 1;
    const debtRatio = (totalDebt / totalAssets) * 100;
    
    // Carga financiera mensual (pagos deuda / ingreso mensual)
    const monthlyIncome = totalIncome;
    const financialBurden = monthlyIncome > 0 ? (monthlyDebtPayment / monthlyIncome) * 100 : 0;
    
    // Relación deuda/ingreso anual
    const annualIncome = totalIncome * 12;
    const debtToIncomeRatio = annualIncome > 0 ? totalDebt / annualIncome : 0;
    
    // Intereses sobre ingreso
    const interestOnIncome = monthlyIncome > 0 ? (monthlyInterestPaid / monthlyIncome) * 100 : 0;
    
    // 3. GASTOS Y CONSUMO
    const fixedExpenses = transactions
      .filter(t => t.type === 'expense' && t.frequency && t.frequency !== 'once')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const variableExpenses = totalExpenses - fixedExpenses;
    const fixedExpensesPercentage = totalExpenses > 0 ? (fixedExpenses / totalExpenses * 100) : 0;
    const variableExpensesPercentage = totalExpenses > 0 ? (variableExpenses / totalExpenses * 100) : 0;
    const variableExpensesOnIncome = monthlyIncome > 0 ? (variableExpenses / monthlyIncome) * 100 : 0;
    
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const daysInPeriod = 30;
    const avgDailyExpense = totalExpenses / daysInPeriod;
    
    // Gastos hormiga (gastos pequeños < $50)
    const antExpenses = expenseTransactions
      .filter(t => Number(t.amount) < 50)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const antExpensesPercentage = monthlyIncome > 0 ? (antExpenses / monthlyIncome) * 100 : 0;
    
    // Gasto en ocio/entretenimiento
    const leisureExpenses = expenseTransactions
      .filter(t => {
        const cat = t.categories?.name?.toLowerCase() || '';
        return cat.includes('ocio') || cat.includes('entretenimiento') || 
               cat.includes('diversión') || cat.includes('hobbies');
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const leisurePercentage = totalExpenses > 0 ? (leisureExpenses / totalExpenses) * 100 : 0;
    
    // 4. AHORRO E INVERSIÓN
    const projectedAnnualSavings = balance * 12;
    const savingsGrowthRate = savingsRate;
    
    // Tasa de inversión personal (asumimos 0 por ahora)
    const investmentAmount = 0; // TODO: obtener de tabla inversiones
    const investmentRate = monthlyIncome > 0 ? (investmentAmount / monthlyIncome) * 100 : 0;
    
    // ROE personal (rendimiento sobre patrimonio)
    const annualGains = 0; // TODO: obtener ganancias de inversiones
    const totalEquity = balance > 0 ? balance : 1;
    const personalROE = (annualGains / totalEquity) * 100;
    
    // Crecimiento patrimonial (simulado - necesitaríamos histórico)
    const previousEquity = totalEquity * 0.9; // Simulado
    const equityGrowth = previousEquity > 0 ? ((totalEquity - previousEquity) / previousEquity) * 100 : 0;
    
    // 5. RENTABILIDAD Y EFICIENCIA
    const returnOnSavings = balance > 0 ? (annualGains / balance) * 100 : 0;
    const personalROI = investmentAmount > 0 ? ((annualGains - investmentAmount) / investmentAmount) * 100 : 0;
    
    // 6. ESTABILIDAD Y PLANEACIÓN
    const passiveIncome = 0; // TODO: obtener de tabla ingresos pasivos
    const financialIndependenceIndex = monthlyExpenses > 0 ? passiveIncome / monthlyExpenses : 0;
    
    // Índice de sostenibilidad ((ahorro + inversiones) / deudas)
    const sustainabilityIndex = totalDebt > 0 ? (balance + investmentAmount) / totalDebt : balance > 0 ? 999 : 0;
    
    // Índice de estabilidad del ingreso
    const lowestIncome = totalIncome * 0.85; // Simulado - idealmente histórico
    const incomeStability = totalIncome > 0 ? lowestIncome / totalIncome : 0;
    
    // 7. INDICADORES DE METAS
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
    
    // 8. COMPORTAMIENTO
    const consistencyScore = expenseTransactions.length > 0 ? 
      Math.min(100, (expenseTransactions.filter(t => Number(t.amount) < avgDailyExpense * 1.5).length / expenseTransactions.length) * 100) 
      : 0;
    
    // Detectar gastos impulsivos (>2x el promedio)
    const impulsivePurchases = expenseTransactions.filter(t => Number(t.amount) > avgDailyExpense * 2).length;
    const impulsivePurchasesPercentage = expenseTransactions.length > 0 ? 
      (impulsivePurchases / expenseTransactions.length) * 100 : 0;
    
    // Índice de bienestar financiero (subjetivo + score moni)
    // Por ahora solo usamos score moni
    
    // 9. SCORE MONI (0-100) - Ponderado
    let scoreMoni = 0;
    
    // Ahorro y liquidez (30%)
    const savingsComponent = Math.min(30, (savingsRate / 20) * 30);
    const liquidityComponent = Math.min(30, liquidityMonths * 10);
    scoreMoni += (savingsComponent + liquidityComponent) / 2;
    
    // Endeudamiento (20%)
    const debtComponent = totalDebt > 0 ? Math.max(0, 20 - (financialBurden / 5)) : 20;
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
    
    // 10. MINDFUL SPENDING INDEX
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
      // 1. LIQUIDEZ
      totalIncome,
      totalExpenses,
      balance,
      savingsRate: Math.round(savingsRate * 100) / 100,
      liquidityMonths: Math.round(liquidityMonths * 100) / 100,
      liquidityCoefficient: Math.round(liquidityCoefficient * 100) / 100,
      cashFlowAccumulated,
      
      // 2. ENDEUDAMIENTO
      totalDebt,
      debtRatio: Math.round(debtRatio * 100) / 100,
      financialBurden: Math.round(financialBurden * 100) / 100,
      debtToIncomeRatio: Math.round(debtToIncomeRatio * 100) / 100,
      interestOnIncome: Math.round(interestOnIncome * 100) / 100,
      
      // 3. GASTOS Y CONSUMO
      fixedExpenses,
      variableExpenses,
      fixedExpensesPercentage: Math.round(fixedExpensesPercentage * 100) / 100,
      variableExpensesPercentage: Math.round(variableExpensesPercentage * 100) / 100,
      variableExpensesOnIncome: Math.round(variableExpensesOnIncome * 100) / 100,
      avgDailyExpense: Math.round(avgDailyExpense),
      antExpenses: Math.round(antExpenses),
      antExpensesPercentage: Math.round(antExpensesPercentage * 100) / 100,
      leisureExpenses: Math.round(leisureExpenses),
      leisurePercentage: Math.round(leisurePercentage * 100) / 100,
      
      // 4. AHORRO E INVERSIÓN
      projectedAnnualSavings: Math.round(projectedAnnualSavings),
      savingsGrowthRate: Math.round(savingsGrowthRate * 100) / 100,
      investmentRate: Math.round(investmentRate * 100) / 100,
      personalROE: Math.round(personalROE * 100) / 100,
      equityGrowth: Math.round(equityGrowth * 100) / 100,
      
      // 5. RENTABILIDAD Y EFICIENCIA
      returnOnSavings: Math.round(returnOnSavings * 100) / 100,
      personalROI: Math.round(personalROI * 100) / 100,
      
      // 6. ESTABILIDAD Y PLANEACIÓN
      financialIndependenceIndex: Math.round(financialIndependenceIndex * 100) / 100,
      sustainabilityIndex: Math.round(sustainabilityIndex * 100) / 100,
      incomeStability: Math.round(incomeStability * 100) / 100,
      
      // 7. COMPORTAMIENTO Y METAS
      avgGoalCompletion: Math.round(avgGoalCompletion),
      consistencyScore: Math.round(consistencyScore),
      impulsivePurchases,
      impulsivePurchasesPercentage: Math.round(impulsivePurchasesPercentage * 100) / 100,
      
      // 8. SCORE MONI Y SALUD FINANCIERA
      scoreMoni,
      mindfulSpendingIndex: Math.round(mindfulSpendingIndex),
      
      // Componentes del Score (para visualización radar)
      scoreComponents: {
        savingsAndLiquidity: Math.round((savingsComponent + liquidityComponent) / 2),
        debt: Math.round(debtComponent),
        control: Math.round(controlComponent),
        growth: Math.round(growthComponent),
        behavior: Math.round(behaviorComponent)
      }
    };

    // Generar AI insights usando Lovable AI
    const aiPrompt = `Eres Moni, un coach financiero de clase mundial. Analiza estos datos financieros del usuario con TODAS las razones financieras esenciales:

📊 PERIODO: ${period}

💰 1. LIQUIDEZ Y ESTABILIDAD:
- Ingresos: $${totalIncome.toLocaleString()}
- Gastos: $${totalExpenses.toLocaleString()}
- Balance: $${balance.toLocaleString()}
- Tasa de ahorro: ${savingsRate.toFixed(1)}% (Ideal ≥ 20%)
- Liquidez inmediata: ${liquidityMonths.toFixed(1)} meses (Ideal ≥ 3)
- Coeficiente de liquidez: ${liquidityCoefficient.toFixed(2)} (Ideal ≥ 1.0)

💳 2. ENDEUDAMIENTO:
- Deuda total: $${totalDebt.toLocaleString()}
- Razón de endeudamiento: ${debtRatio.toFixed(1)}% (Ideal < 50%)
- Carga financiera mensual: ${financialBurden.toFixed(1)}% (Ideal < 30%)
- Relación deuda/ingreso: ${debtToIncomeRatio.toFixed(2)} (Ideal < 1.0)
- Intereses sobre ingreso: ${interestOnIncome.toFixed(1)}% (Ideal < 10%)

💸 3. CONTROL DE GASTOS:
- Gastos fijos: $${fixedExpenses.toLocaleString()} (${fixedExpensesPercentage.toFixed(1)}%) - Ideal < 60%
- Gastos variables: $${variableExpenses.toLocaleString()} (${variableExpensesPercentage.toFixed(1)}%)
- Variables sobre ingreso: ${variableExpensesOnIncome.toFixed(1)}% (Ideal < 40%)
- Gasto promedio diario: $${avgDailyExpense.toLocaleString()}
- Gastos hormiga: $${antExpenses.toLocaleString()} (${antExpensesPercentage.toFixed(1)}%) - Ideal < 5%
- Gasto en ocio: $${leisureExpenses.toLocaleString()} (${leisurePercentage.toFixed(1)}%) - Ideal < 15%

💎 4. AHORRO E INVERSIÓN:
- Proyección anual de ahorro: $${projectedAnnualSavings.toLocaleString()}
- Tasa de inversión: ${investmentRate.toFixed(1)}% (Ideal ≥ 10%)
- ROE personal: ${personalROE.toFixed(1)}% (Ideal > 5% anual)
- Crecimiento patrimonial: ${equityGrowth.toFixed(1)}% (Meta > 10%)

📈 5. RENTABILIDAD:
- Retorno sobre ahorro: ${returnOnSavings.toFixed(1)}% (Ideal > 4% anual)
- ROI personal: ${personalROI.toFixed(1)}% (Ideal > 5-10%)

🛡️ 6. ESTABILIDAD Y PLANEACIÓN:
- Índice de independencia financiera: ${financialIndependenceIndex.toFixed(2)} (Meta ≥ 1.0)
- Índice de sostenibilidad: ${sustainabilityIndex.toFixed(2)} (Ideal ≥ 1.0)
- Estabilidad del ingreso: ${incomeStability.toFixed(2)} (Ideal > 0.8)

🎯 7. COMPORTAMIENTO:
- Cumplimiento de metas: ${avgGoalCompletion.toFixed(1)}%
- Índice de consistencia: ${consistencyScore.toFixed(1)}/100 (Ideal ≥ 75%)
- Compras impulsivas: ${impulsivePurchases} (${impulsivePurchasesPercentage.toFixed(1)}%) - Ideal < 10%
- Mindful Spending: ${mindfulSpendingIndex.toFixed(0)}/100

🏆 SCORE MONI: ${scoreMoni}/100

📊 Top 5 categorías de gasto:
${topCategories.map((c, i) => \`\${i + 1}. \${c.name}: $\${Number(c.total).toLocaleString()} (\${c.percentage}%)\`).join('\n')}

Genera un análisis financiero integral y profesional que:

1. **Resumen Ejecutivo** (3-4 frases): Evalúa TODAS las dimensiones de salud financiera.

2. **Análisis por Razones Financieras**:
   - Liquidez: ¿Está preparado para emergencias?
   - Endeudamiento: ¿Su nivel de deuda es saludable?
   - Gastos: ¿Dónde puede optimizar? (fijos, hormiga, ocio)
   - Inversión: ¿Está haciendo crecer su patrimonio?
   - Estabilidad: ¿Qué tan cerca está de la independencia financiera?

3. **Fortalezas y Áreas de Oportunidad**: Identifica 2-3 de cada una.

4. **3 Recomendaciones Accionables Prioritarias**: Basadas en las razones que más necesitan mejora.

5. **Proyección a 6-12 meses**: Si mantiene estos hábitos, ¿dónde estará?

6. **Mensaje Motivacional**: Reconoce logros y motiva a seguir mejorando.

Sé profesional pero cercano. Usa las razones financieras como un médico usa análisis clínicos: para diagnosticar y recetar soluciones específicas.`;

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