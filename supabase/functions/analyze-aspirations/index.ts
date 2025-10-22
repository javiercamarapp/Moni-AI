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

    const prompt = `ERES UN ASESOR FINANCIERO EXPERTO EN INVERSIONES Y CRECIMIENTO EXPONENCIAL.

DATOS DEL USUARIO:
- Ahorro mensual: $${Math.round(monthlySavings).toLocaleString('es-MX')}
- Meta: $${totalAspiration.toLocaleString('es-MX')}
- Brecha: $${gap.toLocaleString('es-MX')}
- Tiempo ahorrando sin invertir: ${(gap / monthlySavings / 12).toFixed(1)} años

🚨 INSTRUCCIÓN CRÍTICA: Tu respuesta DEBE incluir OBLIGATORIAMENTE todos estos elementos:

1. CÁLCULO CON INTERÉS COMPUESTO (OBLIGATORIO):
   Debes calcular EXACTAMENTE cuánto tiempo tarda en llegar a la meta si invierte los $${Math.round(monthlySavings).toLocaleString('es-MX')} mensuales con diferentes tasas:
   
   - CETES (6% anual): Con esta tasa conservadora, alcanzaría $${totalAspiration.toLocaleString('es-MX')} en X años
   - Fondos indexados S&P 500 (10% anual): Con esta tasa moderada, alcanzaría la meta en Y años  
   - ETFs diversificados (12% anual): Combinando diferentes ETFs, alcanzaría la meta en Z años
   
   IMPORTANTE: Debes mencionar los años ESPECÍFICOS con cada tasa.

2. COMPARACIÓN DRAMÁTICA (OBLIGATORIO):
   Debes mostrar la diferencia:
   - Sin invertir: ${(gap / monthlySavings / 12).toFixed(1)} años
   - Invirtiendo al 10%: [CALCULAR] años
   - Ahorro de tiempo: [DIFERENCIA] años menos

3. RECOMENDACIONES ESPECÍFICAS DE INSTRUMENTOS (OBLIGATORIO):
   Debes mencionar AL MENOS 3 de estos:
   - CETES (gobierno mexicano, bajo riesgo)
   - Fondos indexados como S&P 500 o MSCI World
   - ETFs (VTI, VOO, o similares)
   - Fondos de inversión en GBM o similares
   - Bienes raíces (REITs)

4. ESTRATEGIA DE DIVERSIFICACIÓN (OBLIGATORIO):
   Ejemplo: "Recomiendo dividir tu ahorro mensual así: 50% en fondos indexados S&P 500, 30% en CETES para seguridad, 20% en ETFs internacionales"

EJEMPLO DE RESPUESTA QUE DEBES SEGUIR:

Tu ahorro mensual actual es de $${Math.round(monthlySavings).toLocaleString('es-MX')}. Si solo ahorras sin invertir, te tomará ${(gap / monthlySavings / 12).toFixed(1)} años alcanzar tu meta.

PERO el poder del interés compuesto cambia TODO:

Invirtiendo en CETES (6 por ciento anual): Llegarías a tu meta en [CALCULAR CON FÓRMULA] años, ahorrando [DIFERENCIA] años.

Invirtiendo en fondos indexados S&P 500 (10 por ciento anual): Alcanzarías tu meta en [CALCULAR] años, reduciendo el tiempo a menos de la mitad.

Invirtiendo en ETFs diversificados (12 por ciento anual): Lograrías tu objetivo en solo [CALCULAR] años.

MI RECOMENDACIÓN: Divide tu ahorro así: 50 por ciento en fondos indexados S&P 500 (mejor rendimiento histórico), 30 por ciento en CETES (seguridad), 20 por ciento en ETFs internacionales (diversificación). Con esta estrategia y rendimiento promedio de 9 por ciento anual, alcanzarías tu meta en aproximadamente [CALCULAR] años en lugar de ${(gap / monthlySavings / 12).toFixed(1)} años.

FORMATO:
- Máximo 300 palabras
- NO uses símbolos markdown
- DEBES mencionar tasas de interés específicas (6%, 10%, 12%)
- DEBES mencionar instrumentos específicos (CETES, ETFs, fondos indexados)
- DEBES calcular años con cada escenario
- DEBES mostrar el ahorro de tiempo`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Eres un asesor financiero experto en inversiones, interés compuesto y crecimiento exponencial. SIEMPRE incluyes cálculos matemáticos específicos con tasas de rendimiento y mencionas instrumentos de inversión concretos como CETES, ETFs y fondos indexados. Tu especialidad es mostrar cómo el interés compuesto reduce drásticamente el tiempo para alcanzar metas financieras.' },
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