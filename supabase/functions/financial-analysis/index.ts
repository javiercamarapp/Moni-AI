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
    const { userId, period = 'month', type } = await req.json();
    
    console.log('Request type:', type, 'for user:', userId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle suggestions request
    if (type === 'suggestions') {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(name, type)')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false })
        .limit(50);

      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId);

      const totalIncome = transactions
        ?.filter(t => t.type === 'income' || t.type === 'ingreso')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const totalExpenses = transactions
        ?.filter(t => t.type === 'expense' || t.type === 'gasto')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const balance = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

      // Categorías principales
      const expensesByCategory: Record<string, number> = {};
      transactions?.filter(t => t.type === 'expense' || t.type === 'gasto').forEach(t => {
        const category = t.categories?.name || 'Sin categoría';
        expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(t.amount);
      });

      const topCategory = Object.entries(expensesByCategory)
        .sort((a, b) => b[1] - a[1])[0];

      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured');
      }

      const suggestionsPrompt = `Basándote en estos datos financieros del usuario, genera 4 sugerencias personalizadas para preguntas de chat:

DATOS DEL USUARIO:
- Balance: $${balance.toLocaleString()}
- Tasa de ahorro: ${savingsRate.toFixed(1)}%
- Categoría con más gasto: ${topCategory ? topCategory[0] : 'N/A'} ($${topCategory ? topCategory[1].toLocaleString() : '0'})
- Número de metas: ${goals?.length || 0}
- Transacciones recientes: ${transactions?.length || 0}

Genera sugerencias relevantes y personalizadas como:
- Si tiene baja tasa de ahorro: "Cómo ahorrar más dinero"
- Si gasta mucho en una categoría: "Analizar gastos en [categoría]"
- Si tiene metas: "Revisar progreso de mis metas"
- Si tiene balance negativo: "Plan para mejorar mis finanzas"

IMPORTANTE: Responde SOLO con un JSON array. Cada sugerencia debe tener:
- title: pregunta corta y directa (máximo 35 caracteres)
- subtitle: descripción breve (máximo 25 caracteres)

Ejemplo formato:
[
  {"title": "Analizar gastos en comida", "subtitle": "optimiza tu presupuesto"},
  {"title": "Crear meta de ahorro", "subtitle": "para tu objetivo"}
]`;

      const suggestionsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              content: 'Eres un asistente financiero que genera sugerencias personalizadas. Responde SOLO con JSON válido.'
            },
            {
              role: 'user',
              content: suggestionsPrompt
            }
          ]
        })
      });

      if (suggestionsResponse.ok) {
        try {
          const suggestionsData = await suggestionsResponse.json();
          const suggestionsContent = suggestionsData.choices[0].message.content;
          const jsonMatch = suggestionsContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const suggestions = JSON.parse(jsonMatch[0]);
            return new Response(JSON.stringify({ suggestions }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } catch (e) {
          console.error('Error parsing suggestions:', e);
        }
      }

      // Fallback suggestions
      return new Response(JSON.stringify({
        suggestions: [
          { title: "Analizar mis gastos", subtitle: "del mes actual" },
          { title: "Ver mi progreso", subtitle: "de ahorro" },
          { title: "Crear una meta", subtitle: "de ahorro" },
          { title: "Revisar presupuesto", subtitle: "mensual" }
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Define current date and period start date
    const now = new Date();
    const startDate = period === 'year' 
      ? new Date(now.getFullYear(), 0, 1) 
      : new Date(now.getFullYear(), now.getMonth(), 1);
    
    const endDate = period === 'year'
      ? new Date(now.getFullYear(), 11, 31)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    console.log('Period:', period, 'Start date:', startDate.toISOString().split('T')[0], 'End date:', endDate.toISOString().split('T')[0]);

    // Obtener transacciones del período seleccionado
    console.log('Fetching transactions for user:', userId, 'period:', period);
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*, categories(name, type)')
      .eq('user_id', userId)
      .gte('transaction_date', startDate.toISOString().split('T')[0])
      .lte('transaction_date', endDate.toISOString().split('T')[0])
      .order('transaction_date', { ascending: false });
    console.log('Transactions found for period:', transactions?.length || 0);

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
    
    // Obtener activos líquidos del usuario
    const { data: assets } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId);
    
    // Función para determinar si un activo es líquido
    const isLiquidAsset = (category: string, name?: string) => {
      const cat = category.toLowerCase();
      const accountName = name?.toLowerCase() || '';
      
      // Activos NO líquidos (tienen prioridad en la exclusión)
      const illiquidKeywords = [
        'retirement', 'pension', 'retiro', 'pensión', '401k', 'ira', 'roth',
        'property', 'real estate', 'propiedad', 'inmueble', 'edificio',
        'machinery', 'maquinaria', 'equipment', 'equipo',
        'certificate', 'certificado', 'cd',
        'annuity', 'anualidad', 'plan', 'jubilación', 'jubilacion'
      ];
      
      const hasIlliquidKeyword = illiquidKeywords.some(keyword => 
        cat.includes(keyword) || accountName.includes(keyword)
      );
      
      if (hasIlliquidKeyword) return false;
      
      // Activos líquidos: efectivo, depósitos bancarios, valores negociables, fondos
      const liquidKeywords = [
        'cash', 'efectivo', 'dinero',
        'checking', 'corriente', 'cuenta corriente',
        'saving', 'ahorro', 'cuenta de ahorro',
        'money market', 'mercado de dinero',
        'deposit', 'depósito', 'depósito a la vista'
      ];
      
      return liquidKeywords.some(keyword => cat.includes(keyword));
    };
    
    // Calcular liquidez total (solo activos líquidos)
    const totalLiquidAssets = assets?.filter(a => isLiquidAsset(a.category, a.name))
      .reduce((sum, a) => sum + Number(a.value), 0) || 0;
    
    const totalIncome = transactions
      .filter(t => t.type === 'income' || t.type === 'ingreso')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense' || t.type === 'gasto')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
    
    // Liquidez inmediata (meses que puedes vivir con tus activos líquidos)
    const monthlyExpenses = totalExpenses;
    const liquidityMonths = monthlyExpenses > 0 ? (totalLiquidAssets / monthlyExpenses) : 0;
    
    // Coeficiente de liquidez (activos líquidos / pasivos corto plazo)
    const liquidityCoefficient = monthlyExpenses > 0 ? (totalLiquidAssets / monthlyExpenses) : 0;
    
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
      .filter(t => (t.type === 'expense' || t.type === 'gasto') && t.frequency && t.frequency !== 'once')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const variableExpenses = totalExpenses - fixedExpenses;
    const fixedExpensesPercentage = totalExpenses > 0 ? (fixedExpenses / totalExpenses * 100) : 0;
    const variableExpensesPercentage = totalExpenses > 0 ? (variableExpenses / totalExpenses * 100) : 0;
    const variableExpensesOnIncome = monthlyIncome > 0 ? (variableExpenses / monthlyIncome) * 100 : 0;
    
    const expenseTransactions = transactions.filter(t => t.type === 'expense' || t.type === 'gasto');
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
    
    // Ahorro y liquidez (30 pts total)
    // 15 pts por tasa de ahorro (ideal: 20% o más)
    const savingsComponent = Math.min(15, (savingsRate / 20) * 15);
    // 15 pts por fondo de emergencia (ideal: 3-6 meses de gastos líquidos)
    const liquidityComponent = Math.min(15, (liquidityMonths / 3) * 15);
    const avgSavingsLiquidity = savingsComponent + liquidityComponent;
    scoreMoni += avgSavingsLiquidity;
    
    // Endeudamiento (20%)
    const debtComponent = totalDebt > 0 ? Math.max(0, Math.min(20, 20 - (financialBurden / 5))) : 20;
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
    
    console.log('🎯 Score Moni Calculation:', {
      savingsRate: savingsRate.toFixed(2) + '%',
      liquidityMonths: liquidityMonths.toFixed(2),
      savingsComponent: savingsComponent.toFixed(2) + '/15',
      liquidityComponent: liquidityComponent.toFixed(2) + '/15',
      avgSavingsLiquidity: avgSavingsLiquidity.toFixed(2) + '/30',
      debtComponent: debtComponent.toFixed(2) + '/20',
      controlComponent: controlComponent.toFixed(2) + '/20',
      growthComponent: growthComponent.toFixed(2) + '/15',
      behaviorComponent: behaviorComponent.toFixed(2) + '/15',
      totalBeforeRound: (avgSavingsLiquidity + debtComponent + controlComponent + growthComponent + behaviorComponent).toFixed(2),
      scoreMoni
    });
    
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
      if (t.type === 'income' || t.type === 'ingreso') {
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
      totalLiquidAssets: Math.round(totalLiquidAssets),
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
        savingsAndLiquidity: Math.min(30, Math.round(avgSavingsLiquidity)),
        debt: Math.min(20, Math.round(debtComponent)),
        control: Math.min(20, Math.round(controlComponent)),
        growth: Math.min(15, Math.round(growthComponent)),
        behavior: Math.min(15, Math.round(behaviorComponent))
      }
    };

    // Calcular datos adicionales para nuevos widgets
    
    // Safe-to-Spend: ingreso - gastos fijos - apartados (asumimos 10% para metas)
    const savingsGoalsAmount = totalIncome * 0.10;
    const safeToSpend = totalIncome - fixedExpenses - savingsGoalsAmount;
    
    // Próximas transacciones (simuladas - idealmente de calendario)
    const upcomingTransactions = [
      { description: 'Nómina', amount: totalIncome, date: 'En 5 días', type: 'income', risk: 'low', daysUntil: 5 },
      { description: 'Renta', amount: fixedExpenses * 0.4, date: 'En 3 días', type: 'expense', risk: balance > fixedExpenses ? 'low' : 'high', daysUntil: 3 },
      { description: 'Tarjeta de crédito', amount: fixedExpenses * 0.2, date: 'En 12 días', type: 'expense', risk: 'medium', daysUntil: 12 }
    ];
    
    // Top 3 acciones de ahorro (basadas en análisis de gastos)
    const topActions = [
      { 
        title: topCategories[0] ? `Reducir "${topCategories[0].name}" 10%` : 'Reducir gasto principal',
        description: topCategories[0] ? `Tu categoría más alta. Un pequeño recorte genera gran impacto.` : 'Optimiza tu categoría principal',
        impact: topCategories[0] ? Number(topCategories[0].total) * 0.10 : 0,
        type: 'reduce'
      },
      {
        title: `Revisar ${expenseTransactions.length} transacciones`,
        description: 'Identifica gastos duplicados o innecesarios',
        impact: antExpenses * 0.30,
        type: 'optimize'
      },
      {
        title: fixedExpenses > totalIncome * 0.5 ? 'Renegociar gastos fijos' : 'Aumentar ahorro automático',
        description: fixedExpenses > totalIncome * 0.5 ? 'Tus gastos fijos superan el 50% del ingreso' : 'Aprovecha el buen margen',
        impact: fixedExpenses > totalIncome * 0.5 ? fixedExpenses * 0.10 : totalIncome * 0.05,
        type: 'save'
      }
    ].filter(a => a.impact > 0);
    
    // Calcular promedio de ahorro mensual histórico para diferentes horizontes
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const start5Years = new Date(now);
    start5Years.setFullYear(start5Years.getFullYear() - 5);
    const start10Years = new Date(now);
    start10Years.setFullYear(start10Years.getFullYear() - 10);
    
    console.log('📊 Obteniendo transacciones históricas desde:', start10Years.toISOString().split('T')[0], 'hasta:', now.toISOString().split('T')[0]);
    
    const { data: historicalTxs } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('transaction_date', start10Years.toISOString().split('T')[0])
      .lte('transaction_date', now.toISOString().split('T')[0]);
    
    console.log('📊 Transacciones históricas encontradas:', historicalTxs?.length || 0);
    
    // Agrupar por mes y calcular balance mensual SOLO de meses completados
    const monthlyData: Record<string, { income: number; expenses: number }> = {};
    const currentMonth = now.toISOString().substring(0, 7); // YYYY-MM actual
    
    historicalTxs?.forEach(tx => {
      const monthKey = tx.transaction_date.substring(0, 7); // YYYY-MM
      // NO incluir el mes actual en el promedio histórico (aún no termina)
      if (monthKey >= currentMonth) return;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }
      
      if (tx.type === 'income' || tx.type === 'ingreso') {
        monthlyData[monthKey].income += Number(tx.amount);
      } else if (tx.type === 'expense' || tx.type === 'gasto') {
        monthlyData[monthKey].expenses += Number(tx.amount);
      }
    });
    
    const completedMonthsBalances = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        balance: data.income - data.expenses
      }))
      .sort((a, b) => b.month.localeCompare(a.month)); // Más reciente primero
    
    console.log('📊 Meses completados analizados:', completedMonthsBalances.length);
    console.log('📊 Balances mensuales:', completedMonthsBalances.slice(0, 12).map(m => ({ 
      month: m.month, 
      balance: Math.round(m.balance) 
    })));
    
    // Calcular promedios para diferentes horizontes temporales
    const last12Months = completedMonthsBalances.slice(0, 12);
    const last60Months = completedMonthsBalances.slice(0, 60);
    const last120Months = completedMonthsBalances.slice(0, 120);
    
    const avgMonthlySavings12M = last12Months.length > 0
      ? last12Months.reduce((sum, m) => sum + m.balance, 0) / last12Months.length
      : balance;
    
    const avgMonthlySavings60M = last60Months.length > 0
      ? last60Months.reduce((sum, m) => sum + m.balance, 0) / last60Months.length
      : avgMonthlySavings12M;
    
    const avgMonthlySavings120M = last120Months.length > 0
      ? last120Months.reduce((sum, m) => sum + m.balance, 0) / last120Months.length
      : avgMonthlySavings60M;
    
    console.log('📊 Promedios calculados por horizonte:', {
      promedio12Meses: Math.round(avgMonthlySavings12M),
      promedio60Meses: Math.round(avgMonthlySavings60M),
      promedio120Meses: Math.round(avgMonthlySavings120M),
      mesesUsados12M: last12Months.length,
      mesesUsados60M: last60Months.length,
      mesesUsados120M: last120Months.length
    });
    
    // Proyecciones usando promedios específicos por horizonte temporal
    // Acumular mes a mes usando el promedio apropiado para cada periodo
    const forecastData = [];
    let accumulatedSavings = 0; // Mantener acumulado real
    
    console.log('📊 Generando proyecciones con promedios por horizonte');
    
    // Generar 120 meses (10 años) de proyección
    for (let i = 1; i <= 120; i++) {
      const monthDate = new Date(now);
      monthDate.setMonth(monthDate.getMonth() + i);
      
      // Formatear etiqueta según el tiempo transcurrido
      let monthLabel;
      if (i <= 12) {
        monthLabel = monthDate.toLocaleDateString('es-MX', { month: 'short' });
      } else if (i % 12 === 0) {
        monthLabel = `Año ${i / 12}`;
      } else {
        monthLabel = `${monthDate.toLocaleDateString('es-MX', { month: 'short' })} '${String(monthDate.getFullYear()).slice(-2)}`;
      }
      
      // Seleccionar el promedio apropiado según el horizonte y acumular
      let monthlyAvgForThisMonth;
      if (i <= 12) {
        monthlyAvgForThisMonth = avgMonthlySavings12M; // 1er año: promedio 12 meses
      } else if (i <= 60) {
        monthlyAvgForThisMonth = avgMonthlySavings60M; // Años 2-5: promedio 5 años
      } else {
        monthlyAvgForThisMonth = avgMonthlySavings120M; // Años 6-10: promedio 10 años
      }
      
      // Acumular el ahorro de este mes
      accumulatedSavings += monthlyAvgForThisMonth;
      
      forecastData.push({
        month: monthLabel,
        conservative: Math.max(0, accumulatedSavings * 0.7),
        realistic: accumulatedSavings,
        optimistic: accumulatedSavings * 1.3
      });
    }
    
    console.log('📊 Proyección para diferentes horizontes:', {
      mes12: { 
        conservative: Math.round(forecastData[11].conservative),
        realistic: Math.round(forecastData[11].realistic),
        optimistic: Math.round(forecastData[11].optimistic),
        promedioUsado: Math.round(avgMonthlySavings12M)
      },
      año5: { 
        conservative: Math.round(forecastData[59].conservative),
        realistic: Math.round(forecastData[59].realistic),
        optimistic: Math.round(forecastData[59].optimistic),
        promedioUsado: Math.round(avgMonthlySavings60M)
      },
      año10: { 
        conservative: Math.round(forecastData[119].conservative),
        realistic: Math.round(forecastData[119].realistic),
        optimistic: Math.round(forecastData[119].optimistic),
        promedioUsado: Math.round(avgMonthlySavings120M)
      }
    });
    
    // Calcular probabilidad de cumplir meta basándose en desempeño financiero
    const mainGoal = goalsProgress.length > 0 ? goalsProgress[0] : null;
    const remainingAmount = mainGoal ? (mainGoal.target - mainGoal.current) : 0;
    
    let goalProbability = 0;
    let monthsToGoal = 0;
    
    if (mainGoal && avgMonthlySavings12M > 0 && remainingAmount > 0) {
      // Calcular meses necesarios para alcanzar la meta
      monthsToGoal = Math.ceil(remainingAmount / avgMonthlySavings12M);
      
      // Calcular consistencia del ahorro (menor varianza = mayor consistencia)
      const savingsVariance = monthlyBalances.map(m => m.balance).reduce((acc, bal, i, arr) => {
        if (i === 0) return 0;
        return acc + Math.pow(bal - arr[i-1], 2);
      }, 0) / (monthlyBalances.length - 1);
      const consistencyScore = Math.max(0, 100 - (savingsVariance / avgMonthlySavings12M));
      
      // Evaluar tendencia (últimos 6 meses vs primeros 6 meses)
      const recentSavings = monthlyBalances.slice(0, Math.min(6, monthlyBalances.length))
        .reduce((sum, m) => sum + m.balance, 0) / Math.min(6, monthlyBalances.length);
      const olderSavings = monthlyBalances.slice(-6)
        .reduce((sum, m) => sum + m.balance, 0) / Math.min(6, monthlyBalances.length);
      const trendMultiplier = recentSavings >= olderSavings ? 1.1 : 0.9;
      
      // Evaluar si el ritmo es razonable (meta alcanzable en menos de 5 años = 60 meses)
      let timeScore = 100;
      if (monthsToGoal > 60) timeScore = 30;
      else if (monthsToGoal > 36) timeScore = 50;
      else if (monthsToGoal > 24) timeScore = 70;
      else if (monthsToGoal > 12) timeScore = 85;
      
      // Calcular probabilidad final
      const baseProbability = (
        timeScore * 0.5 +           // 50% peso en tiempo razonable
        consistencyScore * 0.3 +     // 30% peso en consistencia
        Math.min(100, (avgMonthlySavings12M / (remainingAmount / 12)) * 100) * 0.2  // 20% peso en capacidad de ahorro
      ) * trendMultiplier;
      
      goalProbability = Math.min(95, Math.max(5, Math.round(baseProbability)));
      
      console.log('🎯 Cálculo de probabilidad de meta:', {
        remainingAmount,
        avgMonthlySavings12M,
        monthsToGoal,
        consistencyScore: Math.round(consistencyScore),
        timeScore,
        trendMultiplier,
        finalProbability: goalProbability
      });
    }
    
    const goalETA = monthsToGoal > 0 
      ? monthsToGoal <= 12 
        ? `${monthsToGoal} meses`
        : `${Math.round(monthsToGoal / 12)} años`
      : 'N/A';
    
    // Presupuesto por categoría (basado en presupuestos reales del usuario)
    const { data: userBudgets } = await supabase
      .from('category_budgets')
      .select('*, categories(id, name)')
      .eq('user_id', userId);
    
    let categoryBudgets: any[] = [];
    let hasBudgets = false;
    
    if (userBudgets && userBudgets.length > 0) {
      hasBudgets = true;
      
      // Para cada presupuesto configurado, calcular cuánto se gastó
      categoryBudgets = userBudgets.map(budget => {
        const categoryName = budget.categories?.name || 'Sin categoría';
        const spent = expensesByCategory[categoryName] || 0;
        const monthlyBudget = Number(budget.monthly_budget);
        
        return {
          name: categoryName,
          spent,
          budget: monthlyBudget,
          percentUsed: monthlyBudget > 0 ? (spent / monthlyBudget) * 100 : 0,
          icon: categoryName.toLowerCase().includes('comida') ? '🍔' :
                categoryName.toLowerCase().includes('transport') ? '🚗' :
                categoryName.toLowerCase().includes('hogar') ? '🏠' :
                categoryName.toLowerCase().includes('salud') ? '💊' :
                categoryName.toLowerCase().includes('ocio') ? '🎮' :
                categoryName.toLowerCase().includes('educación') ? '📚' : '💳'
        };
      }).filter(b => b.budget > 0); // Solo mostrar presupuestos con valor
    }
    
    // Plan de pago de deudas (simulado - idealmente de tabla deudas)
    const debts = totalDebt > 0 ? [
      {
        name: 'Tarjeta Banco X',
        balance: totalDebt * 0.6,
        interest: 42,
        minPayment: totalDebt * 0.6 * 0.03,
        order: 1,
        payoffDate: 'Mar 2026',
        interestSaved: totalDebt * 0.6 * 0.05
      },
      {
        name: 'Préstamo Personal',
        balance: totalDebt * 0.4,
        interest: 18,
        minPayment: totalDebt * 0.4 * 0.05,
        order: 2,
        payoffDate: 'Jun 2026',
        interestSaved: totalDebt * 0.4 * 0.03
      }
    ] : [];
    
    // Suscripciones (detectar transacciones recurrentes)
    const subscriptions = transactions
      .filter(t => t.frequency && t.frequency !== 'once' && (t.type === 'expense' || t.type === 'gasto'))
      .slice(0, 5)
      .map(t => ({
        name: t.description || 'Suscripción',
        amount: Number(t.amount),
        frequency: 'monthly',
        lastUsed: new Date(t.transaction_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
        daysUnused: Math.floor((now.getTime() - new Date(t.transaction_date).getTime()) / (1000 * 60 * 60 * 24)),
        priceChange: Math.random() > 0.7 ? Math.round(Number(t.amount) * 0.1) : 0, // Simulado
        icon: '💳'
      }));
    const totalSubscriptions = subscriptions.reduce((sum, s) => sum + s.amount, 0);
    
    // Patrimonio neto histórico (simulado - últimos 12 meses)
    const netWorthHistory = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = monthDate.toLocaleDateString('es-MX', { month: 'short' });
      const simAssets = balance * (0.7 + (i * 0.025));
      const simLiabilities = totalDebt * (1 - (i * 0.05));
      netWorthHistory.push({
        month: monthLabel,
        assets: simAssets,
        liabilities: simLiabilities,
        netWorth: simAssets - simLiabilities
      });
    }
    
    // Cambio en score (simulado)
    const previousScore = Math.max(0, scoreMoni - Math.floor(Math.random() * 15));
    const scoreChange = scoreMoni - previousScore;
    const changeReason = scoreChange > 0 
      ? `+${scoreChange} pts por ↑ ahorro (${savingsRate.toFixed(1)}%) y control de gastos`
      : scoreChange < 0 
      ? `${scoreChange} pts por ↑ gasto variable (+${variableExpensesPercentage.toFixed(0)}%)`
      : 'Sin cambios significativos';

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
${topCategories.map((c, i) => `${i + 1}. ${c.name}: $${Number(c.total).toLocaleString()} (${c.percentage}%)`).join('\n')}

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

    // Generar indicadores de riesgo con IA
    const riskPrompt = `Basándote en estas métricas financieras, genera 3-5 indicadores de riesgo o felicitaciones:

MÉTRICAS:
- Tasa de ahorro: ${savingsRate.toFixed(1)}% (Ideal ≥ 20%)
- Liquidez: ${liquidityMonths.toFixed(1)} meses (Ideal ≥ 3)
- Carga financiera: ${financialBurden.toFixed(1)}% (Ideal < 30%)
- Gastos fijos: ${fixedExpensesPercentage.toFixed(1)}% (Ideal < 60%)
- Gastos hormiga: ${antExpensesPercentage.toFixed(1)}% (Ideal < 5%)
- Score Moni: ${scoreMoni}/100
- Compras impulsivas: ${impulsivePurchasesPercentage.toFixed(1)}% (Ideal < 10%)

Genera un JSON array con indicadores. Cada indicador debe tener:
- level: "critical" (problemas graves), "warning" (áreas de mejora), o "good" (felicitaciones)
- message: mensaje corto (máximo 100 caracteres) con datos específicos

IMPORTANTE: 
- Usa "critical" para métricas MUY por debajo del ideal
- Usa "warning" para áreas que necesitan atención  
- Usa "good" para métricas que superan el ideal
- Incluye números específicos en cada mensaje
- Sé directo y útil

Responde SOLO con el JSON array, sin texto adicional.`;

    const riskResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'Eres un analista financiero experto. Responde SOLO con JSON válido.'
          },
          {
            role: 'user',
            content: riskPrompt
          }
        ]
      })
    });

    let riskIndicators = [];
    if (riskResponse.ok) {
      try {
        const riskData = await riskResponse.json();
        const riskContent = riskData.choices[0].message.content;
        // Extraer JSON del contenido (por si viene con markdown)
        const jsonMatch = riskContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          riskIndicators = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Error parsing risk indicators:', e);
      }
    }

    // Calcular proyecciones
    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const avgDailyExpenses = totalExpenses / daysElapsed;
    const avgDailyIncome = totalIncome / daysElapsed;
    
    const projectionDays = period === 'year' ? 365 : 30;
    const projectedExpenses = avgDailyExpenses * projectionDays;
    const projectedIncome = avgDailyIncome * projectionDays;
    const projectedBalance = projectedIncome - projectedExpenses;

    // Calcular promedios históricos (últimos 6 o 12 meses según el período)
    console.log('Calculating historical averages for period:', period);
    const monthsToAnalyze = period === 'year' ? 12 : 6;
    const historicalStartDate = new Date();
    historicalStartDate.setMonth(historicalStartDate.getMonth() - monthsToAnalyze);
    
    // Obtener transacciones históricas
    const historicalTransactions = transactions.filter(t => 
      new Date(t.transaction_date) >= historicalStartDate
    );
    
    console.log(`Historical transactions found (last ${monthsToAnalyze} months):`, historicalTransactions.length);
    
    // Agrupar por mes y calcular promedios
    const historicalMonthlyData: Record<string, { income: number; expenses: number }> = {};
    
    historicalTransactions.forEach(t => {
      const monthKey = t.transaction_date.substring(0, 7); // YYYY-MM
      if (!historicalMonthlyData[monthKey]) {
        historicalMonthlyData[monthKey] = { income: 0, expenses: 0 };
      }
      
      const amount = Number(t.amount);
      if (t.type === 'income' || t.type === 'ingreso') {
        historicalMonthlyData[monthKey].income += amount;
      } else if (t.type === 'expense' || t.type === 'gasto') {
        historicalMonthlyData[monthKey].expenses += amount;
      }
    });
    
    const monthsWithData = Object.keys(historicalMonthlyData).length;
    console.log('Months with data:', monthsWithData);
    
    // Calcular promedios
    let totalHistoricalIncome = 0;
    let totalHistoricalExpenses = 0;
    
    Object.values(historicalMonthlyData).forEach(({ income, expenses }) => {
      totalHistoricalIncome += income;
      totalHistoricalExpenses += expenses;
    });
    
    const avgMonthlyIncome = monthsWithData > 0 ? Math.round(totalHistoricalIncome / monthsWithData) : 0;
    const avgMonthlyExpenses = monthsWithData > 0 ? Math.round(totalHistoricalExpenses / monthsWithData) : 0;
    const avgBalance = avgMonthlyIncome - avgMonthlyExpenses;
    
    console.log('Historical averages calculated:', {
      avgMonthlyIncome,
      avgMonthlyExpenses,
      avgBalance,
      monthsAnalyzed: monthsWithData
    });

    // Construir objeto de respuesta
    const responseData = {
      analysis,
      metrics,
      topCategories,
      riskIndicators,
      projections: {
        expenses: Math.round(projectedExpenses),
        income: Math.round(projectedIncome),
        balance: Math.round(projectedBalance),
        period: projectionDays === 365 ? 'Anual' : 'Mensual'
      },
      dailyCashFlow,
      safeToSpend: {
        amount: safeToSpend,
        monthlyIncome: totalIncome,
        fixedExpenses,
        savingsGoals: savingsGoalsAmount
      },
      upcomingTransactions: {
        transactions: upcomingTransactions,
        periodDays: 30,
        historicalAverages: {
          avgMonthlyIncome: avgMonthlyIncome,
          avgMonthlyExpenses: avgMonthlyExpenses,
          avgBalance: avgBalance,
          monthsAnalyzed: monthsToAnalyze,
          period: period
        }
      },
      topActions,
      scoreBreakdown: {
        components: metrics.scoreComponents,
        scoreMoni,
        previousScore,
        changeReason
      },
      netWorth: {
        netWorth: balance - totalDebt,
        assets: balance,
        liabilities: totalDebt,
        historicalData: netWorthHistory,
        runwayMonths: liquidityMonths
      },
      forecast: {
        forecastData,
        goalProbability,
        goalETA,
        goalInfo: mainGoal ? {
          title: mainGoal.title,
          target: mainGoal.target,
          current: mainGoal.current,
          progress: (mainGoal.current / mainGoal.target) * 100
        } : null
      },
      budgetProgress: {
        categories: categoryBudgets,
        hasBudgets
      },
      debtPlan: {
        debts,
        strategy: 'avalanche',
        totalInterest: totalDebt * 0.15,
        dti: financialBurden
      },
      subscriptions: {
        subscriptions,
        totalMonthly: totalSubscriptions
      }
    };

    // Guardar score y componentes en la base de datos para carga instantánea
    if (scoreMoni !== undefined && metrics.scoreComponents) {
      await supabase
        .from('user_scores')
        .upsert({
          user_id: userId,
          score_moni: Math.round(scoreMoni),
          components: metrics.scoreComponents,
          last_calculated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
    }

    return new Response(JSON.stringify(responseData), {
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