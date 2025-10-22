import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { aspirations, totalAspiration, currentNetWorth } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user info
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      throw new Error('User not authenticated')
    }

    // ========== OBTENER TODA LA INFORMACIÓN HISTÓRICA DEL USUARIO ==========
    
    // 1. TRANSACCIONES - TODAS usando múltiples queries para evitar límites
    let allTransactions: any[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true
    
    while (hasMore) {
      const { data: batch } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)
      
      if (batch && batch.length > 0) {
        allTransactions = [...allTransactions, ...batch]
        page++
        hasMore = batch.length === pageSize
      } else {
        hasMore = false
      }
    }
    
    console.log('Total transactions fetched:', allTransactions.length)
    
    // 2. ASSETS - Patrimonio actual
    const { data: assets } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', user.id)
    
    // 3. LIABILITIES - Deudas actuales
    const { data: liabilities } = await supabase
      .from('liabilities')
      .select('*')
      .eq('user_id', user.id)
    
    // 4. NET WORTH SNAPSHOTS - Evolución histórica del patrimonio
    const { data: netWorthSnapshots } = await supabase
      .from('net_worth_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: false })
      .limit(12)
    
    // 5. PROFILE - Info del usuario y nivel
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    // 6. USER SCORE - Score Moni
    const { data: userScore } = await supabase
      .from('user_scores')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    // 7. GOALS - Metas del usuario
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
    
    // 8. CHALLENGES - Retos activos
    const { data: challenges } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
    
    // 9. CATEGORY BUDGETS - Presupuestos configurados
    const { data: categoryBudgets } = await supabase
      .from('category_budgets')
      .select('*, categories(*)')
      .eq('user_id', user.id)
    
    // 10. FIXED EXPENSES CONFIG - Gastos fijos
    const { data: fixedExpenses } = await supabase
      .from('fixed_expenses_config')
      .select('*')
      .eq('user_id', user.id)

    // ========== CALCULAR MÉTRICAS FINANCIERAS ==========
    
    const incomeTransactions = allTransactions?.filter(t => t.type === 'ingreso' || t.type === 'income') || []
    const expenseTransactions = allTransactions?.filter(t => t.type === 'gasto' || t.type === 'expense') || []
    
    const totalIncomeAllTime = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpensesAllTime = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    
    // Calcular promedio mensual basado en los ÚLTIMOS 12 MESES calendario
    let monthlyIncome = 0
    let monthlyExpenses = 0
    
    if (allTransactions && allTransactions.length > 0) {
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
      
      const recentIncome = incomeTransactions.filter(t => new Date(t.transaction_date) >= twelveMonthsAgo)
      const recentExpenses = expenseTransactions.filter(t => new Date(t.transaction_date) >= twelveMonthsAgo)
      
      const recentIncomeTotal = recentIncome.reduce((sum, t) => sum + Number(t.amount), 0)
      const recentExpensesTotal = recentExpenses.reduce((sum, t) => sum + Number(t.amount), 0)
      
      monthlyIncome = recentIncomeTotal / 12
      monthlyExpenses = recentExpensesTotal / 12
      
      console.log('Last 12 months calculation:', {
        recentIncomeTotal,
        recentExpensesTotal,
        recentIncomeCount: recentIncome.length,
        recentExpensesCount: recentExpenses.length,
        monthlyIncome: Math.round(monthlyIncome),
        monthlyExpenses: Math.round(monthlyExpenses)
      })
    }
    
    const totalFixedExpenses = fixedExpenses?.reduce((sum, fe) => sum + Number(fe.monthly_amount), 0) || 0
    
    if (monthlyExpenses === 0 && totalFixedExpenses > 0) {
      monthlyExpenses = totalFixedExpenses
    }
    
    const monthlySavings = monthlyIncome - monthlyExpenses
    
    const totalAssets = assets?.reduce((sum, a) => sum + Number(a.value), 0) || 0
    const totalLiabilities = liabilities?.reduce((sum, l) => sum + Number(l.value), 0) || 0
    
    const netWorthEvolution = netWorthSnapshots?.slice(0, 6).map(snap => ({
      date: snap.snapshot_date,
      value: snap.net_worth
    })) || []
    
    let netWorthGrowthRate = 0
    if (netWorthSnapshots && netWorthSnapshots.length >= 2) {
      const oldest = netWorthSnapshots[netWorthSnapshots.length - 1]
      const newest = netWorthSnapshots[0]
      const monthsDiff = Math.max(1, netWorthSnapshots.length)
      netWorthGrowthRate = ((newest.net_worth - oldest.net_worth) / oldest.net_worth) * 100 / monthsDiff
    }
    
    console.log('COMPLETE Financial data:', {
      totalTransactions: allTransactions?.length || 0,
      incomeTransactions: incomeTransactions.length,
      expenseTransactions: expenseTransactions.length,
      totalIncomeAllTime,
      totalExpensesAllTime,
      monthlyIncome: Math.round(monthlyIncome),
      monthlyExpenses: Math.round(monthlyExpenses),
      monthlySavings: Math.round(monthlySavings),
      totalAssets,
      totalLiabilities,
      netWorthSnapshots: netWorthSnapshots?.length || 0,
      netWorthGrowthRate,
      userLevel: profile?.level,
      scoreMoni: userScore?.score_moni,
      activeGoals: goals?.length || 0,
      activeChallenges: challenges?.length || 0,
      fixedExpensesConfigured: totalFixedExpenses,
      calculationMethod: 'Last 12 months average'
    })

    const gap = totalAspiration - currentNetWorth
    const gapPercentage = currentNetWorth > 0 ? ((gap / totalAspiration) * 100).toFixed(1) : 100

    console.log('Analyzing aspirations with data:', {
      currentNetWorth,
      totalAspiration,
      gap,
      aspirationsCount: aspirations.length
    })

    const prompt = `Eres el mejor asesor financiero del mundo. Tu misión es recomendar las FORMAS MÁS RÁPIDAS de alcanzar la meta financiera, aprovechando el poder del crecimiento exponencial e inversiones.

ANÁLISIS DEL FLUJO ACTUAL:
- Ingresos mensuales: $${Math.round(monthlyIncome).toLocaleString('es-MX')}
- Gastos mensuales: $${Math.round(monthlyExpenses).toLocaleString('es-MX')}
- Ahorro mensual actual: $${Math.round(monthlySavings).toLocaleString('es-MX')}
- Meta aspiracional: $${totalAspiration.toLocaleString('es-MX')}
- Patrimonio actual: $${currentNetWorth.toLocaleString('es-MX')}
- Brecha a cubrir: $${gap.toLocaleString('es-MX')}
- Tiempo SIN INVERSIONES: ${Math.round(gap / monthlySavings)} meses (${(gap / monthlySavings / 12).toFixed(1)} años)

🎯 TU MISIÓN: Mostrar cómo REDUCIR DRÁSTICAMENTE este tiempo usando el PODER DEL INTERÉS COMPUESTO

INSTRUCCIONES OBLIGATORIAS:

1. CALCULAR ESCENARIOS DE INVERSIÓN (mínimo 2 escenarios):
   
   Escenario A - Conservador (5-7% anual):
   - Invirtiendo los $${Math.round(monthlySavings).toLocaleString('es-MX')} mensuales en CETES, bonos, o fondos indexados
   - Con rendimiento del 6% anual compuesto
   - Tiempo para alcanzar meta: X años (en lugar de ${(gap / monthlySavings / 12).toFixed(1)} años)
   
   Escenario B - Moderado (10-12% anual):
   - Invirtiendo en fondos de inversión diversificados, ETFs, o bienes raíces
   - Con rendimiento del 10% anual compuesto
   - Tiempo para alcanzar meta: Y años (en lugar de ${(gap / monthlySavings / 12).toFixed(1)} años)
   
   Escenario C - Agresivo (15%+ anual):
   - Combinación de acciones, startups, o negocios propios
   - Con rendimiento del 15% anual compuesto
   - Tiempo para alcanzar meta: Z años (en lugar de ${(gap / monthlySavings / 12).toFixed(1)} años)

2. MOSTRAR EL PODER DEL INTERÉS COMPUESTO:
   Explica cómo $${Math.round(monthlySavings).toLocaleString('es-MX')} mensuales invertidos a X% anual se convierten en Y pesos en Z años, versus solo $${(monthlySavings * 12 * (gap / monthlySavings / 12)).toLocaleString('es-MX')} sin invertir.

3. RECOMENDAR ESTRATEGIAS ESPECÍFICAS:
   - Dónde invertir el ahorro mensual (nombres específicos: CETES, S&P 500, fondos GBM, etc)
   - Cómo diversificar (porcentajes: 60% renta variable, 30% fondos, 10% alternativas)
   - Qué hacer con activos actuales para generar rendimientos

4. CALCULAR IMPACTO TOTAL:
   Si combina optimizar flujo (ahorro de $${Math.round(monthlySavings * 1.2).toLocaleString('es-MX')}) + inversión moderada (10% anual), alcanzaría meta en SOLO X años, recortando Y años del tiempo original.

FORMATO CRÍTICO:
- Máximo 250 palabras
- NO uses markdown ni símbolos especiales
- Texto plano con saltos de línea
- ENFÓCATE en INVERSIONES y CRECIMIENTO EXPONENCIAL
- Incluye CÁLCULOS EXACTOS con diferentes tasas de rendimiento
- Menciona instrumentos de inversión ESPECÍFICOS
- Muestra la DIFERENCIA en años entre ahorrar e invertir`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Eres un asesor financiero experto que se especializa en optimización de flujo de efectivo y reducción de tiempos para alcanzar metas financieras.' },
          { role: 'user', content: prompt }
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('AI gateway error:', response.status, data)
      throw new Error(data.error?.message || 'Failed to generate analysis')
    }

    const analysis = data.choices[0].message.content

    console.log('Generated analysis length:', analysis.length)

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze-aspirations function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})