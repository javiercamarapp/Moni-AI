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

    const prompt = `Eres un asesor financiero experto certificado con amplia experiencia en planificación patrimonial. Analiza de manera exhaustiva las aspiraciones financieras del usuario y proporciona un análisis comparativo detallado.

INFORMACIÓN FINANCIERA DEL USUARIO:
- Net Worth Actual: $${currentNetWorth.toLocaleString('es-MX')}
- Net Worth Aspiracional: $${totalAspiration.toLocaleString('es-MX')}
- Brecha a cerrar: $${gap.toLocaleString('es-MX')} (${gapPercentage}%)

ASPIRACIONES DETALLADAS:
${aspirationsList}

INSTRUCCIONES PARA EL ANÁLISIS:

Como experto financiero, debes realizar un análisis comparativo exhaustivo entre la situación actual y las aspiraciones. Compara cada aspiración con su valor actual, identifica brechas específicas, y proporciona estrategias concretas y priorizadas para cerrar cada una.

Debes incluir:
- Análisis detallado de viabilidad de cada aspiración
- Comparativas específicas entre situación actual y metas
- Timeframes realistas basados en el perfil financiero
- Estrategias de ahorro e inversión específicas con montos
- Priorización basada en urgencia, viabilidad y retorno
- Plan de acción paso a paso con fechas estimadas
- Recomendaciones para hacer cada aspiración factible

REGLAS DE FORMATO ESTRICTAS:
- PROHIBIDO usar asteriscos, hashtags, guiones, barras diagonales o cualquier símbolo de markdown
- SOLO usa texto plano, números para listas y saltos de línea
- Usa números (1, 2, 3) o letras (a, b, c) para enumerar, nunca guiones o asteriscos

FORMATO DE RESPUESTA REQUERIDO:
Divide tu análisis en 6 secciones numeradas. Cada sección debe comenzar con número, punto, título en MAYÚSCULAS y contenido detallado en texto plano:

1. EVALUACIÓN REALISTA Y MOTIVADORA DE TUS METAS
Analiza el net worth actual de ${currentNetWorth.toLocaleString('es-MX')} pesos versus la meta de ${totalAspiration.toLocaleString('es-MX')} pesos. Evalúa la viabilidad general y el perfil de riesgo. Sé motivador pero realista sobre los timeframes.

2. ASPIRACIONES MAS IMPORTANTES Y VIABLES
Identifica cuáles aspiraciones son más alcanzables a corto, mediano y largo plazo. Compara el valor de cada aspiración con su importancia estratégica para el patrimonio familiar.

3. ESTRATEGIAS CONCRETAS PARA CERRAR LA BRECHA
Proporciona estrategias específicas con montos. Ejemplo: aumentar ahorro mensual en X cantidad, invertir en Y instrumento con retorno esperado de Z porcentaje. Incluye al menos 4 estrategias concretas.

4. PLAN DE ACCION PASO A PASO
Detalla un plan con fechas estimadas. Ejemplo: Mes 1 a 6 hacer X, Mes 7 a 12 lograr Y, Año 2 alcanzar Z. Incluye al menos 5 pasos priorizados con timeframes.

5. PRIORIZACION DE ASPIRACIONES
Recomienda qué aspiraciones atacar primero y por qué. Justifica con análisis de urgencia, costo oportunidad, viabilidad financiera y beneficio familiar. Ordena las aspiraciones de mayor a menor prioridad.

6. RECOMENDACIONES DE AHORRO E INVERSION
Proporciona recomendaciones específicas: porcentajes de ahorro sugeridos, instrumentos de inversión recomendados (CETES, fondos indexados, etc), estrategias de reducción de gastos, y proyecciones de crecimiento patrimonial esperado.

TONO: Profesional, motivador y práctico. Máximo 700 palabras. Recuerda: SOLO TEXTO PLANO sin símbolos de markdown.`

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
