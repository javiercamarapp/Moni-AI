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

    const prompt = `Eres el mejor asesor financiero del mundo. Tu misión es recomendar formas ESPECÍFICAS de recortar el tiempo necesario para alcanzar la meta financiera.

ANÁLISIS DEL FLUJO ACTUAL:
- Ingresos mensuales: $${Math.round(monthlyIncome).toLocaleString('es-MX')}
- Gastos mensuales: $${Math.round(monthlyExpenses).toLocaleString('es-MX')}
- Ahorro mensual actual: $${Math.round(monthlySavings).toLocaleString('es-MX')}
- Meta aspiracional: $${totalAspiration.toLocaleString('es-MX')}
- Patrimonio actual: $${currentNetWorth.toLocaleString('es-MX')}
- Brecha a cubrir: $${gap.toLocaleString('es-MX')}
- Tiempo estimado actual: ${Math.round(gap / monthlySavings)} meses (${(gap / monthlySavings / 12).toFixed(1)} años)

INSTRUCCIONES OBLIGATORIAS:

1. RECOMENDAR FORMAS DE AUMENTAR INGRESOS (2-3 ideas concretas y accionables):
   Ejemplo: Puede buscar ingresos adicionales mediante freelancing, venta de servicios profesionales, monetizar habilidades existentes, inversiones que generen rendimientos, etc.

2. RECOMENDAR FORMAS DE REDUCIR GASTOS (2-3 acciones específicas):
   Ejemplo: Optimizar gastos hormiga, cancelar suscripciones innecesarias, refinanciar deudas con mejores tasas, eliminar gastos no esenciales, etc.

3. CALCULAR IMPACTO MATEMÁTICO DE CADA OPTIMIZACIÓN:
   - Si logra aumentar ingresos 20 por ciento: nuevos ingresos serían X pesos, nuevo ahorro Y pesos, tiempo Z años
   - Si logra reducir gastos 15 por ciento: nuevos gastos serían X pesos, nuevo ahorro Y pesos, tiempo Z años
   - Si logra AMBAS optimizaciones: ahorro combinado sería X pesos mensuales, alcanzaría meta en solo Y años en lugar de Z años

Ejemplo de estructura de respuesta ideal:

Tu flujo mensual actual es de XXX pesos de ingresos menos YYY pesos de gastos igual ZZZ pesos de ahorro. Con este ritmo alcanzarías tu meta en W años.

PERO si logras:
1. Aumentar tus ingresos a AAA pesos mensuales (mediante BBB y CCC)
2. Reducir gastos a DDD pesos (eliminando EEE y FFF)

Tu ahorro sería de GGG pesos mensuales y alcanzarías tu meta en solo HH años en lugar de WW años, recortando II años del tiempo total.

FORMATO CRÍTICO:
- Máximo 200 palabras
- NO uses markdown ni símbolos especiales
- Texto plano con saltos de línea
- ENFÓCATE 100 por ciento en recomendaciones ACCIONABLES para optimizar el flujo
- Incluye CÁLCULOS MATEMÁTICOS EXACTOS de impacto en años
- Usa cifras y números específicos`

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