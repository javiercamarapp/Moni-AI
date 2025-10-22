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

    // Obtener TODA la información financiera del usuario
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    // Obtener TODAS las transacciones (sin límite de tiempo para tener más datos)
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
    
    // Obtener transacciones de los últimos 3 meses
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('transaction_date', threeMonthsAgo.toISOString().split('T')[0])
    
    // Obtener assets detallados
    const { data: assets } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', user.id)
    
    // Obtener liabilities detallados
    const { data: liabilities } = await supabase
      .from('liabilities')
      .select('*')
      .eq('user_id', user.id)

    // Usar transacciones recientes si hay suficientes, si no, usar todas
    const transactionsToUse = (recentTransactions && recentTransactions.length >= 5) 
      ? recentTransactions 
      : allTransactions || []
    
    const monthsToAverage = (recentTransactions && recentTransactions.length >= 5) ? 3 : 12

    // Calcular ingresos y gastos mensuales promedio
    const incomeTransactions = transactionsToUse.filter(t => t.type === 'income')
    const expenseTransactions = transactionsToUse.filter(t => t.type === 'expense')
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    
    let monthlyIncome = totalIncome / monthsToAverage
    let monthlyExpenses = totalExpenses / monthsToAverage
    
    // Si no hay datos de transacciones, estimar basándose en el net worth
    if (monthlyIncome === 0 && currentNetWorth > 0) {
      // Estimación conservadora: 5% del net worth anual = ingreso mensual aproximado
      monthlyIncome = (currentNetWorth * 0.05) / 12
      console.log('No income transactions found, estimating based on net worth:', monthlyIncome)
    }
    
    const monthlySavings = monthlyIncome - monthlyExpenses
    
    // Assets y liabilities totales
    const totalAssets = assets?.reduce((sum, a) => sum + Number(a.value), 0) || 0
    const totalLiabilities = liabilities?.reduce((sum, l) => sum + Number(l.value), 0) || 0
    
    console.log('Financial data:', {
      totalTransactions: allTransactions?.length || 0,
      recentTransactions: recentTransactions?.length || 0,
      incomeTransactions: incomeTransactions.length,
      expenseTransactions: expenseTransactions.length,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      monthsToAverage
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

    const prompt = `Eres el mejor asesor financiero del mundo. Analiza PROFUNDAMENTE la situación financiera real del usuario.

SITUACIÓN FINANCIERA COMPLETA:

Net Worth:
- Actual: $${currentNetWorth.toLocaleString('es-MX')} (Assets: $${totalAssets.toLocaleString('es-MX')} - Liabilities: $${totalLiabilities.toLocaleString('es-MX')})
- Meta Aspiracional: $${totalAspiration.toLocaleString('es-MX')}
- Brecha a cerrar: $${gap.toLocaleString('es-MX')} (${gapPercentage}%)

Flujo de Efectivo Mensual Real:
- Ingresos promedio: $${monthlyIncome.toLocaleString('es-MX')}/mes
- Gastos promedio: $${monthlyExpenses.toLocaleString('es-MX')}/mes
- Ahorro neto mensual: $${monthlySavings.toLocaleString('es-MX')}/mes

Assets principales: ${assets?.slice(0, 3).map(a => `${a.name} ($${Number(a.value).toLocaleString('es-MX')})`).join(', ')}
Liabilities principales: ${liabilities?.slice(0, 3).map(l => `${l.name} ($${Number(l.value).toLocaleString('es-MX')})`).join(', ')}

INSTRUCCIONES:
Escribe un análisis PERSONALIZADO Y PROFUNDO (máximo 150 palabras) que incluya:

1. Resumen de su situación actual vs aspiracional con los números REALES
2. CALCULA exactamente cuántos meses/años le tomará llegar a su meta si sigue ahorrando $${monthlySavings.toLocaleString('es-MX')}/mes
3. Si el ahorro actual es insuficiente, calcula cuánto NECESITA ahorrar mensualmente para lograrlo en un plazo razonable
4. 3-4 recomendaciones ESPECÍFICAS con cifras exactas basadas en SUS ingresos y gastos reales
5. Menciona oportunidades concretas para aumentar ahorro (reducir gastos o aumentar ingresos)
6. Mensaje motivador final basado en su capacidad real

REGLAS ABSOLUTAS:
- USA los números REALES del usuario ($${monthlyIncome.toLocaleString('es-MX')} ingresos, $${monthlyExpenses.toLocaleString('es-MX')} gastos)
- CALCULA timeframes reales y específicos
- NO uses asteriscos, hashtags, guiones, barras, ni símbolos de markdown
- SOLO texto plano con saltos de línea para separar ideas
- Máximo 150 palabras
- Sé ultra específico con sus números, no genérico

Habla directo, con cifras reales de SU situación.`

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
