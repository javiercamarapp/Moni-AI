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

    const prompt = `Eres el mejor asesor financiero del mundo, un verdadero experto que transforma vidas financieras con planes concretos y motivación inspiradora.

SITUACIÓN FINANCIERA:
- Net Worth Actual: $${currentNetWorth.toLocaleString('es-MX')}
- Meta Aspiracional: $${totalAspiration.toLocaleString('es-MX')}
- Brecha: $${gap.toLocaleString('es-MX')} (${gapPercentage}%)

Sus principales aspiraciones incluyen: ${aspirationsList}

TU MISIÓN:
Analiza la brecha entre su net worth actual y su meta aspiracional. NO analices cada aspiración por separado. En su lugar, proporciona un análisis claro, conciso, motivacional y super accionable sobre CÓMO cerrar esa brecha.

ESTRUCTURA OBLIGATORIA (4 secciones cortas y poderosas):

1. TU SITUACION HOY
En 2 a 3 oraciones máximo: evalúa la brecha de manera realista pero motivadora. Menciona si es alcanzable y en qué timeframe aproximado.

2. ESTRATEGIA MAESTRA PARA LOGRARLO
En 4 a 5 puntos concretos y cortos, describe las acciones más importantes que debe tomar. Incluye cifras específicas cuando sea posible. Ejemplo: Aumenta tu ahorro mensual a 15,000 pesos. Invierte en fondos indexados con retorno esperado del 10 por ciento anual. Reduce gastos hormiga en 3,000 pesos al mes.

3. PLAN DE ACCION CON FECHAS
En 4 a 5 pasos con timeframes claros. Ejemplo: Mes 1 a 3: Construir fondo de emergencia de 50,000 pesos. Mes 4 a 12: Invertir 10,000 pesos mensuales en CETES. Año 2: Aumentar inversiones a 15,000 mensuales.

4. TU CAMINO AL EXITO
En 2 a 3 oraciones, cierra con un mensaje motivador y realista que lo inspire a actuar HOY.

REGLAS ESTRICTAS:
- PROHIBIDO usar asteriscos, hashtags, guiones largos, barras diagonales o cualquier símbolo de markdown
- SOLO texto plano, números para listas y saltos de línea
- Máximo 400 palabras TOTAL
- Cada sección DEBE ser CORTA y CONCRETA
- Usa números para enumerar dentro de cada sección
- Enfócate en la BRECHA TOTAL, no en aspiraciones individuales
- Sé ULTRA ESPECÍFICO con cifras, porcentajes y plazos

TONO: Directo, motivador, inspirador, como un coach financiero de élite que realmente se preocupa por el éxito de su cliente.`

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
