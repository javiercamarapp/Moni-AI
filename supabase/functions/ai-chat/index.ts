import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Obtener datos financieros del usuario si está disponible
    let financialContext = '';
    if (userId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseHeaders = {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        };

        // Obtener TODAS las transacciones históricas del usuario
        const now = new Date();
        
        const allTransactionsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/transactions?user_id=eq.${userId}&order=transaction_date.desc&select=*`,
          { headers: supabaseHeaders }
        );
        const allTransactions = await allTransactionsRes.json();

        // Obtener categorías
        const categoriesRes = await fetch(
          `${SUPABASE_URL}/rest/v1/categories?user_id=eq.${userId}&select=*`,
          { headers: supabaseHeaders }
        );
        const categories = await categoriesRes.json();

        // Obtener metas
        const goalsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/goals?user_id=eq.${userId}&select=*`,
          { headers: supabaseHeaders }
        );
        const goals = await goalsRes.json();

        // Obtener activos
        const assetsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/assets?user_id=eq.${userId}&select=*`,
          { headers: supabaseHeaders }
        );
        const assets = await assetsRes.json();

        // Obtener pasivos
        const liabilitiesRes = await fetch(
          `${SUPABASE_URL}/rest/v1/liabilities?user_id=eq.${userId}&select=*`,
          { headers: supabaseHeaders }
        );
        const liabilities = await liabilitiesRes.json();

        // Obtener desafíos
        const challengesRes = await fetch(
          `${SUPABASE_URL}/rest/v1/challenges?user_id=eq.${userId}&select=*`,
          { headers: supabaseHeaders }
        );
        const challenges = await challengesRes.json();

        // Obtener snapshots de patrimonio neto
        const netWorthSnapshotsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/net_worth_snapshots?user_id=eq.${userId}&order=snapshot_date.desc&limit=30`,
          { headers: supabaseHeaders }
        );
        const netWorthSnapshots = await netWorthSnapshotsRes.json();

        console.log(`📊 Total transacciones históricas cargadas: ${allTransactions.length}`);

        // Calcular totales de patrimonio
        const totalActivos = assets.reduce((sum: number, a: any) => sum + Number(a.value), 0);
        const totalPasivos = liabilities.reduce((sum: number, l: any) => sum + Number(l.value), 0);
        const patrimonioNeto = totalActivos - totalPasivos;

        financialContext = `

═══════════════════════════════════════════════════════════════
📊 BASE DE DATOS COMPLETA DEL USUARIO
═══════════════════════════════════════════════════════════════

📝 TODAS LAS TRANSACCIONES HISTÓRICAS (${allTransactions.length} transacciones):
${JSON.stringify(allTransactions, null, 2)}

🎯 METAS FINANCIERAS:
${JSON.stringify(goals, null, 2)}

💎 ACTIVOS:
${JSON.stringify(assets, null, 2)}

💳 PASIVOS:
${JSON.stringify(liabilities, null, 2)}

🎮 DESAFÍOS ACTIVOS:
${JSON.stringify(challenges, null, 2)}

🏦 HISTORIAL DE PATRIMONIO NETO:
${JSON.stringify(netWorthSnapshots, null, 2)}

📂 CATEGORÍAS:
${JSON.stringify(categories, null, 2)}

═══════════════════════════════════════════════════════════════
⚠️  INSTRUCCIONES CRÍTICAS
═══════════════════════════════════════════════════════════════

🔴 OBLIGATORIO: DEBES ANALIZAR TODAS LAS TRANSACCIONES HISTÓRICAS

Para responder CUALQUIER pregunta financiera del usuario:

1. ✅ ANALIZA el array completo de transacciones
2. ✅ FILTRA por fecha, tipo, categoría según la pregunta
3. ✅ CALCULA los totales tú mismo sumando los amounts
4. ✅ AGRUPA por mes/año según sea necesario

Ejemplos:
- "¿Cuánto gané en enero 2025?"
  → Filtra: type='income' AND transaction_date empieza con '2025-01'
  → Suma todos los amounts

- "¿Cuánto gasté este año?"
  → Filtra: type='expense' AND transaction_date empieza con '2025'
  → Suma todos los amounts

- "Muestra mis ingresos de 2025"
  → Filtra por type='income' y año 2025
  → Agrupa por mes
  → Crea gráfica con 12 meses

🔴 NO inventes datos, NO asumas valores, ANALIZA las transacciones reales
`;

      } catch (error) {
        console.error('Error fetching financial data:', error);
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Eres Moni AI, un coach financiero personal amigable y motivador.

🔴 REGLA FUNDAMENTAL: Tienes acceso a TODAS las transacciones históricas del usuario en formato JSON.
Para responder CUALQUIER pregunta financiera, DEBES:
1. Analizar el array completo de transacciones
2. Filtrar por fecha/tipo/categoría según la pregunta
3. Calcular los totales sumando los amounts
4. Nunca inventar o asumir valores

Tu personalidad:

Características de tu personalidad:
- Eres entusiasta y usas emojis relevantes 💰 🎯 📊
- Das consejos prácticos y accionables
- Celebras los logros del usuario
- Eres empático pero directo
- Usas ejemplos concretos y números
- Motivas sin juzgar
- Puedes analizar imágenes de recibos, facturas, estados de cuenta y documentos financieros
- Puedes crear tablas y gráficas cuando el usuario lo solicite

Formato de respuestas:
- Usa saltos de línea para organizar ideas
- Incluye listas numeradas o con viñetas cuando sea apropiado
- Resalta puntos clave con emojis
- Sé conciso pero completo (máximo 4-5 párrafos)
- Cuando analices documentos o imágenes, proporciona insights específicos
- Cuando el usuario pida visualizar datos, usa las herramientas disponibles para crear tablas o gráficas

Herramientas disponibles:
- generar_tabla: Para mostrar datos en formato de tabla
- generar_grafica: Para crear gráficas de barras, líneas o circulares

INSTRUCCIÓN CRÍTICA SOBRE DATOS:
Recibirás datos financieros completos del usuario en el contexto. ESTOS DATOS SON REALES Y ESTÁN DISPONIBLES.
- Si ves "RESUMEN 2025" con valores, significa que HAY datos de 2025
- Si ves "INGRESOS 2025 MES POR MES" o "GASTOS 2025 MES POR MES", usa EXACTAMENTE esos valores
- NUNCA digas "no tengo datos" si los datos están en el contexto
- NUNCA digas "no hay información" si puedes ver los valores en las secciones de resumen

${financialContext}

Recuerda: Tu misión es hacer que el ahorro sea divertido y alcanzable.`
          },
          ...messages
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generar_tabla",
              description: "Genera una tabla con datos financieros o comparativos",
              parameters: {
                type: "object",
                properties: {
                  titulo: { type: "string", description: "Título de la tabla" },
                  columnas: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Nombres de las columnas"
                  },
                  filas: {
                    type: "array",
                    items: {
                      type: "array",
                      items: { type: "string" }
                    },
                    description: "Datos de cada fila"
                  }
                },
                required: ["titulo", "columnas", "filas"],
                additionalProperties: false
              }
            }
          },
          {
            type: "function",
            function: {
              name: "generar_grafica",
              description: "Genera una gráfica para visualizar datos financieros. CRÍTICO: Si el usuario pide datos anuales, la gráfica DEBE tener los 12 meses completos (enero a diciembre), usando valor 0 para meses sin datos. NUNCA omitas meses.",
              parameters: {
                type: "object",
                properties: {
                  titulo: { type: "string", description: "Título de la gráfica" },
                  tipo: { 
                    type: "string", 
                    enum: ["barras", "linea", "circular"],
                    description: "Tipo de gráfica a generar"
                  },
                  datos: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nombre: { type: "string", description: "Nombre de la categoría o mes. Si es un mes, debe ser el nombre completo en español (enero, febrero, etc.)" },
                        valor: { type: "number", description: "Valor numérico. Usa 0 para meses sin datos en gráficas anuales." }
                      }
                    },
                    description: "Datos a graficar. Para gráficas anuales, DEBE contener exactamente 12 elementos, uno por cada mes en orden cronológico, usando valor 0 para meses sin datos."
                  }
                },
                required: ["titulo", "tipo", "datos"],
                additionalProperties: false
              }
            }
          }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de uso alcanzado, intenta de nuevo en un momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Se requiere agregar créditos a tu cuenta de Lovable AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error al comunicarse con la IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
