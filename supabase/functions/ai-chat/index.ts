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
    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const userId = body.userId;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    
    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ response: "Hola, soy Moni AI. ¿En qué puedo ayudarte con tus finanzas?" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

        // Obtener transacciones de 2025 y últimos 6 meses de 2024 para contexto
        const allTransactionsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/transactions?user_id=eq.${userId}&transaction_date=gte.2024-07-01&transaction_date=lte.2025-12-31&order=transaction_date.desc&limit=5000&select=*`,
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
        
        // DEBUG: Ver primeras 10 transacciones
        console.log('🔍 Primeras 10 transacciones:', JSON.stringify(allTransactions.slice(0, 10).map(t => ({
          date: t.transaction_date,
          type: t.type,
          amount: t.amount,
          description: t.description
        })), null, 2));

        // Procesar todas las transacciones para resumen
        const transactionsByMonth: Record<string, any[]> = {};
        allTransactions.forEach((t: any) => {
          const date = new Date(t.transaction_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!transactionsByMonth[monthKey]) {
            transactionsByMonth[monthKey] = [];
          }
          transactionsByMonth[monthKey].push(t);
        });
        
        console.log('🗂️ Meses procesados:', Object.keys(transactionsByMonth).sort());

        // Calcular estadísticas mensuales
        const monthlyStats: Record<string, { 
          mes: string;
          ingresos: number; 
          gastos: number; 
          balance: number;
          numTransacciones: number;
          transacciones: any[];
        }> = {};

        Object.entries(transactionsByMonth).forEach(([monthKey, transactions]) => {
          const [year, month] = monthKey.split('-');
          const monthName = new Date(parseInt(year), parseInt(month) - 1, 1)
            .toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
          
          const ingresos = transactions
            .filter(t => t.type === 'income' || t.type === 'ingreso')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          
          const gastos = transactions
            .filter(t => t.type === 'expense' || t.type === 'gasto')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          monthlyStats[monthKey] = {
            mes: monthName,
            ingresos,
            gastos,
            balance: ingresos - gastos,
            numTransacciones: transactions.length,
            transacciones: transactions
          };
        });

        // Obtener TODOS los meses históricos ordenados
        const sortedMonths = Object.keys(monthlyStats).sort().reverse();

        console.log('📅 Total meses con datos:', sortedMonths.length);
        console.log('📊 Rango:', sortedMonths[sortedMonths.length - 1], 'hasta', sortedMonths[0]);

        // Log para verificar meses específicos de 2025
        console.log('🔍 Verificando datos de 2025:');
        ['2025-01', '2025-02', '2025-03', '2025-04'].forEach(key => {
          const stats = monthlyStats[key];
          if (stats) {
            console.log(`${key}: ingresos=$${stats.ingresos}, gastos=$${stats.gastos}, transacciones=${stats.numTransacciones}`);
          } else {
            console.log(`${key}: NO EXISTE`);
          }
        });

        // Calcular totales de patrimonio
        const totalActivos = assets.reduce((sum: number, a: any) => sum + Number(a.value), 0);
        const totalPasivos = liabilities.reduce((sum: number, l: any) => sum + Number(l.value), 0);
        const patrimonioNeto = totalActivos - totalPasivos;

        financialContext = `

═══════════════════════════════════════════════════════════════
📊 ANÁLISIS FINANCIERO COMPLETO DEL USUARIO
═══════════════════════════════════════════════════════════════

📝 TOTAL TRANSACCIONES HISTÓRICAS: ${allTransactions.length}
📅 PERÍODO COMPLETO: ${sortedMonths.length} meses de datos

┌─────────────────────────────────────────────────────────────┐
│  RESUMEN MENSUAL COMPLETO (Todos los meses históricos)
└─────────────────────────────────────────────────────────────┘

${sortedMonths.map(monthKey => {
  const stats = monthlyStats[monthKey];
  return `📅 ${stats.mes}:
   💰 Ingresos: $${stats.ingresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
   💸 Gastos: $${stats.gastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
   📈 Balance: $${stats.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
   📝 Transacciones: ${stats.numTransacciones}`;
}).join('\n\n')}

┌─────────────────────────────────────────────────────────────┐
│  TRANSACCIONES DE LOS ÚLTIMOS 6 MESES (Detalle completo)
└─────────────────────────────────────────────────────────────┘

${sortedMonths.slice(0, 6).map(monthKey => {
  const stats = monthlyStats[monthKey];
  return `
🗓️  ${stats.mes} - ${stats.numTransacciones} transacciones:
${stats.transacciones.map((t: any) => 
  `   ${new Date(t.transaction_date).toLocaleDateString('es-MX')} | ${t.type === 'income' || t.type === 'ingreso' ? '💰' : '💸'} $${Number(t.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} | ${t.description}`
).join('\n')}`;
}).join('\n')}

┌─────────────────────────────────────────────────────────────┐
│  METAS FINANCIERAS
└─────────────────────────────────────────────────────────────┘
${goals.length > 0 ? goals.map((g: any) => `
🎯 ${g.title}
   Objetivo: $${Number(g.target).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
   Actual: $${Number(g.current).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
   Progreso: ${((Number(g.current) / Number(g.target)) * 100).toFixed(1)}%`).join('\n') : 'No hay metas registradas'}

┌─────────────────────────────────────────────────────────────┐
│  PATRIMONIO NETO
└─────────────────────────────────────────────────────────────┘
💎 Total Activos: $${totalActivos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
💳 Total Pasivos: $${totalPasivos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
🏦 Patrimonio Neto: $${patrimonioNeto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

ACTIVOS:
${assets.length > 0 ? assets.map((a: any) => `  • ${a.name} (${a.category}): $${Number(a.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`).join('\n') : '  No hay activos'}

PASIVOS:
${liabilities.length > 0 ? liabilities.map((l: any) => `  • ${l.name} (${l.category}): $${Number(l.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`).join('\n') : '  No hay pasivos'}

┌─────────────────────────────────────────────────────────────┐
│  DESAFÍOS ACTIVOS
└─────────────────────────────────────────────────────────────┘
${challenges.length > 0 ? challenges.map((c: any) => `
🎮 ${c.title} (${c.status})
   Objetivo: $${Number(c.target_amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
   Actual: $${Number(c.current_amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
   Progreso: ${((Number(c.current_amount) / Number(c.target_amount)) * 100).toFixed(1)}%`).join('\n') : 'No hay desafíos activos'}

═══════════════════════════════════════════════════════════════
⚠️  INSTRUCCIONES PARA RESPONDER PREGUNTAS
═══════════════════════════════════════════════════════════════

🔴 REGLAS OBLIGATORIAS:

1. Para preguntas sobre ingresos/gastos de un mes específico:
   ✅ Busca el mes en "RESUMEN MENSUAL"
   ✅ Usa los valores exactos mostrados
   ✅ Si un mes muestra $0.00 = NO hubo movimientos ese mes
   ✅ Si un mes NO aparece en la lista = NO existe en la BD

2. Para crear gráficas o análisis anuales:
   ✅ Extrae los datos de "RESUMEN MENSUAL" para cada mes
   ✅ Incluye todos los 12 meses del año (usa $0 si no hay datos)
   ✅ NUNCA inventes valores

3. Para preguntas sobre transacciones específicas:
   ✅ Revisa "TRANSACCIONES DE LOS ÚLTIMOS 6 MESES"
   ✅ Muestra fechas, montos y descripciones exactas

4. NUNCA digas "no tengo acceso" o "no puedo ver" - TODA la información está arriba
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

REGLA FUNDAMENTAL: Tienes acceso a TODAS las transacciones históricas del usuario en formato JSON.
Para responder CUALQUIER pregunta financiera, DEBES:
1. Analizar el array completo de transacciones
2. Filtrar por fecha/tipo/categoria segun la pregunta
3. Calcular los totales sumando los amounts
4. Nunca inventar o asumir valores

REGLAS DE FORMATO OBLIGATORIAS:
- NUNCA uses apostrofes (') en tus respuestas - usa comillas dobles (") si necesitas citar algo
- NUNCA uses signos de numeral/hashtag (#) en tus respuestas
- Usa guiones (-) o asteriscos (*) para listas en lugar de numerales con hashtag

Tu personalidad:

Caracteristicas de tu personalidad:
- Eres entusiasta y usas emojis relevantes
- Das consejos practicos y accionables
- Celebras los logros del usuario
- Eres empatico pero directo
- Usas ejemplos concretos y numeros
- Motivas sin juzgar

Formato de respuestas:
- Usa saltos de linea para organizar ideas
- Incluye listas numeradas o con vinetas cuando sea apropiado
- Resalta puntos clave con emojis
- Se conciso pero completo (maximo 4-5 parrafos)

INSTRUCCION CRITICA SOBRE DATOS:
Recibiras datos financieros completos del usuario en el contexto. ESTOS DATOS SON REALES Y ESTAN DISPONIBLES.
- Si ves "RESUMEN 2025" con valores, significa que HAY datos de 2025
- NUNCA digas "no tengo datos" si los datos estan en el contexto

${financialContext}

Recuerda: Tu mision es hacer que el ahorro sea divertido y alcanzable.`
          },
          ...messages
        ],
        stream: false,
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

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Lo siento, no pude generar una respuesta.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});