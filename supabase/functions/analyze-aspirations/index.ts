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
    
    // 1. TRANSACCIONES - Todo el historial
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
    
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
      .limit(12) // Últimos 12 registros
    
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
    
    // Calcular ingresos y gastos de TODO el historial
    const incomeTransactions = allTransactions?.filter(t => t.type === 'income') || []
    const expenseTransactions = allTransactions?.filter(t => t.type === 'expense') || []
    
    const totalIncomeAllTime = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpensesAllTime = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    
    // Calcular promedio mensual basado en el rango de fechas real
    let monthlyIncome = 0
    let monthlyExpenses = 0
    
    if (allTransactions && allTransactions.length > 0) {
      const oldestDate = new Date(allTransactions[allTransactions.length - 1].transaction_date)
      const newestDate = new Date(allTransactions[0].transaction_date)
      const monthsDiff = Math.max(1, (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
      
      monthlyIncome = totalIncomeAllTime / monthsDiff
      monthlyExpenses = totalExpensesAllTime / monthsDiff
    }
    
    // Gastos fijos configurados
    const totalFixedExpenses = fixedExpenses?.reduce((sum, fe) => sum + Number(fe.monthly_amount), 0) || 0
    
    // Si hay gastos fijos configurados y no hay transacciones de gastos, usar esos
    if (monthlyExpenses === 0 && totalFixedExpenses > 0) {
      monthlyExpenses = totalFixedExpenses
    }
    
    const monthlySavings = monthlyIncome - monthlyExpenses
    
    // Assets y liabilities totales
    const totalAssets = assets?.reduce((sum, a) => sum + Number(a.value), 0) || 0
    const totalLiabilities = liabilities?.reduce((sum, l) => sum + Number(l.value), 0) || 0
    
    // Net Worth Evolution (últimos 6 meses)
    const netWorthEvolution = netWorthSnapshots?.slice(0, 6).map(snap => ({
      date: snap.snapshot_date,
      value: snap.net_worth
    })) || []
    
    // Calcular tendencia de crecimiento del patrimonio
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
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      totalAssets,
      totalLiabilities,
      netWorthSnapshots: netWorthSnapshots?.length || 0,
      netWorthGrowthRate,
      userLevel: profile?.level,
      scoreMoni: userScore?.score_moni,
      activeGoals: goals?.length || 0,
      activeChallenges: challenges?.length || 0,
      fixedExpensesConfigured: totalFixedExpenses
    })

    // Map aspirations to readable format
    const aspirationLabels: Record<number, string> = {
      1: "Casa principal",
      2: "Coche de tus sueños",
      3: "Ahorros disponibles",
      4: "Inversiones en bolsa",
      7: "Coche cónyuge",
      8: "Segunda propiedad",
      9: "Propiedades de inversión",
      10: "Terrenos",
      11: "Fondo de emergencia",
      12: "Criptomonedas",
      13: "AFORE/Retiro",
      14: "Empresas/Startups",
      15: "Vehículos extras"
    }

    const aspirationsList = aspirations
      .map((asp: any) => `${aspirationLabels[asp.question_id]}: $${Number(asp.value).toLocaleString('es-MX')}`)
      .join('\n')

    const gap = totalAspiration - currentNetWorth
    const gapPercentage = currentNetWorth > 0 ? ((gap / totalAspiration) * 100).toFixed(1) : 100

    console.log('Analyzing aspirations with data:', {
      currentNetWorth,
      totalAspiration,
      gap,
      aspirationsCount: aspirations.length
    })

    const prompt = `Eres el mejor asesor financiero del mundo. Tienes acceso a TODO el historial financiero del usuario. Analiza PROFUNDAMENTE.

═══════════════════════════════════════════════════════
INFORMACIÓN COMPLETA DEL USUARIO
═══════════════════════════════════════════════════════

📊 NET WORTH:
- Actual: $${currentNetWorth.toLocaleString('es-MX')}
- Meta Aspiracional: $${totalAspiration.toLocaleString('es-MX')}
- Brecha: $${gap.toLocaleString('es-MX')} (${gapPercentage}%)
- Tasa de crecimiento mensual: ${netWorthGrowthRate.toFixed(2)}%

💰 ASSETS (${assets?.length || 0} activos):
${assets?.map(a => `  • ${a.name}: $${Number(a.value).toLocaleString('es-MX')} (${a.category})`).join('\n') || '  Sin assets'}
Total: $${totalAssets.toLocaleString('es-MX')}

💳 LIABILITIES (${liabilities?.length || 0} deudas):
${liabilities?.map(l => `  • ${l.name}: $${Number(l.value).toLocaleString('es-MX')} (${l.category})`).join('\n') || '  Sin deudas'}
Total: $${totalLiabilities.toLocaleString('es-MX')}

💵 HISTORIAL DE TRANSACCIONES (${allTransactions?.length || 0} transacciones):
- Ingresos totales: $${totalIncomeAllTime.toLocaleString('es-MX')} (${incomeTransactions.length} transacciones)
- Gastos totales: $${totalExpensesAllTime.toLocaleString('es-MX')} (${expenseTransactions.length} transacciones)
- Promedio mensual ingresos: $${monthlyIncome.toLocaleString('es-MX')}
- Promedio mensual gastos: $${monthlyExpenses.toLocaleString('es-MX')}
- Ahorro neto mensual: $${monthlySavings.toLocaleString('es-MX')}

📈 EVOLUCIÓN DEL PATRIMONIO (últimos 6 registros):
${netWorthEvolution.map(nw => `  ${nw.date}: $${Number(nw.value).toLocaleString('es-MX')}`).join('\n') || '  No hay historial'}

🎯 METAS ACTIVAS (${goals?.length || 0}):
${goals?.slice(0, 3).map(g => `  • ${g.title}: $${Number(g.current).toLocaleString('es-MX')}/$${Number(g.target).toLocaleString('es-MX')}`).join('\n') || '  Sin metas'}

💪 RETOS ACTIVOS (${challenges?.length || 0}):
${challenges?.slice(0, 3).map(c => `  • ${c.title}: $${Number(c.current_amount).toLocaleString('es-MX')}/$${Number(c.target_amount).toLocaleString('es-MX')}`).join('\n') || '  Sin retos'}

📊 GASTOS FIJOS CONFIGURADOS:
${fixedExpenses?.map(fe => `  • ${fe.category_name}: $${Number(fe.monthly_amount).toLocaleString('es-MX')}`).join('\n') || '  No configurados'}
Total: $${totalFixedExpenses.toLocaleString('es-MX')}/mes

👤 PERFIL:
- Nivel: ${profile?.level || 1}
- XP: ${profile?.xp || 0}
- Score Moni: ${userScore?.score_moni || 40}
- Quiz completado: ${profile?.level_quiz_completed ? 'Sí' : 'No'}

═══════════════════════════════════════════════════════

INSTRUCCIONES PARA TU ANÁLISIS:

Escribe un análisis ULTRA PERSONALIZADO (máximo 150 palabras) que:

1. Resuma su situación real usando TODOS los números disponibles arriba
2. Calcule EXACTAMENTE cuánto tiempo le tomará alcanzar su meta:
   - Si ahorra $${monthlySavings.toLocaleString('es-MX')}/mes actual
   - Cuánto necesita ahorrar para lograrlo en 10 años
   - Cuánto necesita aumentar sus ingresos
3. Mencione assets/liabilities ESPECÍFICOS por nombre y valor
4. Use el historial de crecimiento del patrimonio (${netWorthGrowthRate.toFixed(2)}% mensual)
5. Referencia sus metas y retos activos
6. Da 3 recomendaciones EXACTAS con cifras de SU situación

REGLAS ABSOLUTAS:
✓ USA nombres reales de assets/liabilities
✓ CITA los números exactos arriba
✓ CALCULA plazos matemáticamente
✓ NO uses markdown (*, #, -, /, etc.)
✓ Máximo 150 palabras
✓ Texto plano con saltos de línea

Sé ULTRA específico con SUS datos reales.`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Eres un asesor financiero experto y motivador que ayuda a las personas a alcanzar sus metas financieras.' },
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
