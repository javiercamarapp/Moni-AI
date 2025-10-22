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

    const prompt = `Eres un asesor financiero experto. Analiza las aspiraciones financieras del usuario y proporciona recomendaciones personalizadas y motivadoras.

INFORMACIÓN DEL USUARIO:
- Net Worth Actual: $${currentNetWorth.toLocaleString('es-MX')}
- Net Worth Aspiracional: $${totalAspiration.toLocaleString('es-MX')}
- Brecha a cerrar: $${gap.toLocaleString('es-MX')} (${gapPercentage}%)

ASPIRACIONES DEL USUARIO:
${aspirationsList}

REGLAS DE FORMATO ESTRICTAS:
- PROHIBIDO usar asteriscos (*)
- PROHIBIDO usar hashtags (#)
- PROHIBIDO usar guiones (-)
- PROHIBIDO usar barras (/)
- PROHIBIDO usar markdown
- SOLO usa texto plano y saltos de línea
- Las listas deben ser con números o letras, no con guiones o asteriscos

FORMATO DE RESPUESTA REQUERIDO:
Proporciona tu análisis dividido en 6 secciones numeradas. Cada sección debe comenzar con un número seguido de un punto y el título en MAYÚSCULAS, seguido del contenido en texto plano.

1. EVALUACIÓN REALISTA Y MOTIVADORA DE TUS METAS
Tu evaluación aquí, incluyendo el net worth actual de ${currentNetWorth.toLocaleString('es-MX')} pesos. Usa solo texto plano, sin símbolos especiales.

2. ASPIRACIONES MÁS IMPORTANTES Y VIABLES
Tu análisis aquí en texto plano.

3. ESTRATEGIAS CONCRETAS PARA CERRAR LA BRECHA
Tus estrategias aquí en texto plano. Si necesitas hacer una lista, usa números (1, 2, 3) o letras (a, b, c).

4. PLAN DE ACCIÓN PASO A PASO
Tu plan aquí en texto plano. Usa números para los pasos.

5. PRIORIZACIÓN DE ASPIRACIONES
Tus consejos aquí en texto plano.

6. RECOMENDACIONES DE AHORRO E INVERSIÓN
Tus recomendaciones aquí en texto plano.

El tono debe ser positivo, motivador y práctico. Máximo 600 palabras en total. RECUERDA: SOLO TEXTO PLANO, SIN SÍMBOLOS DE MARKDOWN.`

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
