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

        // Obtener TODAS las transacciones del usuario (sin límite de fecha)
        const now = new Date();
        
        const allTransactionsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/transactions?user_id=eq.${userId}&order=transaction_date.desc&select=*`,
          { headers: supabaseHeaders }
        );
        const allTransactions = await allTransactionsRes.json();
        
        console.log(`Total transacciones obtenidas: ${allTransactions.length}`);
        if (allTransactions.length > 0) {
          console.log('Primera transacción:', allTransactions[0].transaction_date);
          console.log('Última transacción:', allTransactions[allTransactions.length - 1].transaction_date);
          
          // Log de tipos únicos de transacciones
          const uniqueTypes = [...new Set(allTransactions.map((t: any) => t.type))];
          console.log('Tipos de transacciones encontrados:', uniqueTypes);
          
          // Log de algunos ejemplos
          const ingresoExamples = allTransactions.filter((t: any) => 
            t.description?.toLowerCase().includes('salario') || 
            t.description?.toLowerCase().includes('freelance')
          ).slice(0, 3);
          console.log('Ejemplos de transacciones de ingreso:', JSON.stringify(ingresoExamples, null, 2));
        }

        // Obtener categorías
        const categoriesRes = await fetch(
          `${SUPABASE_URL}/rest/v1/categories?user_id=eq.${userId}&select=*`,
          { headers: supabaseHeaders }
        );
        const categories = await categoriesRes.json();

        // Transacciones del mes actual
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthTransactions = allTransactions.filter((t: any) => 
          new Date(t.transaction_date) >= firstDayCurrentMonth
        );

        // Calcular estadísticas del mes actual
        const totalGastosActual = currentMonthTransactions
          .filter((t: any) => t.type === 'expense' || t.type === 'gasto')
          .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        
        const totalIngresosActual = currentMonthTransactions
          .filter((t: any) => t.type === 'income' || t.type === 'ingreso')
          .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

        // Gastos por categoría del mes actual
        const gastosPorCategoriaActual: Record<string, number> = {};
        currentMonthTransactions
          .filter((t: any) => t.type === 'expense' || t.type === 'gasto')
          .forEach((t: any) => {
            const cat = categories.find((c: any) => c.id === t.category_id);
            const catName = cat?.name || 'Sin categoría';
            gastosPorCategoriaActual[catName] = (gastosPorCategoriaActual[catName] || 0) + Number(t.amount);
          });

        // Calcular promedios mensuales históricos
        const monthlyData: Record<string, { gastos: number; ingresos: number; count: number }> = {};
        allTransactions.forEach((t: any) => {
          const date = new Date(t.transaction_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { gastos: 0, ingresos: 0, count: 0 };
          }
          
          const amount = Number(t.amount);
          if (t.type === 'expense' || t.type === 'gasto') {
            monthlyData[monthKey].gastos += amount;
          } else if (t.type === 'income' || t.type === 'ingreso') {
            monthlyData[monthKey].ingresos += amount;
          }
          monthlyData[monthKey].count++;
        });
        
        // Log detallado de 2025
        const data2025 = Object.entries(monthlyData)
          .filter(([key]) => key.startsWith('2025'))
          .reduce((acc, [key, val]) => {
            acc[key] = val;
            return acc;
          }, {} as any);
        console.log('Datos de 2025:', JSON.stringify(data2025, null, 2));
        
        console.log('Meses con datos:', Object.keys(monthlyData).sort());
        console.log('Datos mensuales:', JSON.stringify(monthlyData, null, 2));

        // Estadísticas históricas
        const totalGastosHistoricos = allTransactions
          .filter((t: any) => t.type === 'expense' || t.type === 'gasto')
          .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        
        const totalIngresosHistoricos = allTransactions
          .filter((t: any) => t.type === 'income' || t.type === 'ingreso')
          .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

        const mesesConDatos = Object.keys(monthlyData).length || 1;
        const promedioGastosMensual = mesesConDatos > 0 ? totalGastosHistoricos / mesesConDatos : 0;
        const promedioIngresosMensual = mesesConDatos > 0 ? totalIngresosHistoricos / mesesConDatos : 0;

        // Top categorías históricas
        const gastosHistoricosPorCategoria: Record<string, number> = {};
        allTransactions
          .filter((t: any) => t.type === 'expense' || t.type === 'gasto')
          .forEach((t: any) => {
            const cat = categories.find((c: any) => c.id === t.category_id);
            const catName = cat?.name || 'Sin categoría';
            gastosHistoricosPorCategoria[catName] = (gastosHistoricosPorCategoria[catName] || 0) + Number(t.amount);
          });

        // Extraer datos específicos de 2025 para gráficas
        const meses2025 = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const nombresMeses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        
        const ingresos2025 = meses2025.map((mes, idx) => {
          const key = `2025-${mes}`;
          const data = monthlyData[key];
          return {
            mes: nombresMeses[idx],
            valor: data ? data.ingresos : 0
          };
        });
        
        const gastos2025 = meses2025.map((mes, idx) => {
          const key = `2025-${mes}`;
          const data = monthlyData[key];
          return {
            mes: nombresMeses[idx],
            valor: data ? data.gastos : 0
          };
        });

        const totalIngresos2025 = ingresos2025.reduce((sum, m) => sum + m.valor, 0);
        const totalGastos2025 = gastos2025.reduce((sum, m) => sum + m.valor, 0);
        const promedioIngresos2025 = totalIngresos2025 / 12;
        const promedioGastos2025 = totalGastos2025 / 12;

        console.log('📊 RESUMEN 2025 GENERADO:');
        console.log(`Total ingresos: $${totalIngresos2025}`);
        console.log(`Total gastos: $${totalGastos2025}`);
        console.log('Ingresos por mes:', ingresos2025.filter(m => m.valor > 0));

        financialContext = `

📊 DATOS FINANCIEROS COMPLETOS DEL USUARIO 📊

╔══════════════════════════════════════╗
║   MES ACTUAL (octubre 2025)         ║
╚══════════════════════════════════════╝
Total de gastos: $${totalGastosActual.toFixed(2)}
Total de ingresos: $${totalIngresosActual.toFixed(2)}
Balance: $${(totalIngresosActual - totalGastosActual).toFixed(2)}
Número de transacciones: ${currentMonthTransactions.length}

Gastos por categoría:
${Object.entries(gastosPorCategoriaActual)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([cat, amount]) => `- ${cat}: $${amount.toFixed(2)}`)
  .join('\n')}

╔══════════════════════════════════════╗
║   AÑO 2025 - DATOS COMPLETOS        ║
╚══════════════════════════════════════╝

💰 TOTAL INGRESOS 2025: $${totalIngresos2025.toFixed(2)}
💸 TOTAL GASTOS 2025: $${totalGastos2025.toFixed(2)}
📈 BALANCE 2025: $${(totalIngresos2025 - totalGastos2025).toFixed(2)}
📊 PROMEDIO MENSUAL INGRESOS: $${promedioIngresos2025.toFixed(2)}
📊 PROMEDIO MENSUAL GASTOS: $${promedioGastos2025.toFixed(2)}

🔢 INGRESOS 2025 - VALORES EXACTOS POR MES:
${ingresos2025.map(m => `   ${m.mes}: $${m.valor.toFixed(2)}`).join('\n')}

💵 GASTOS 2025 - VALORES EXACTOS POR MES:
${gastos2025.map(m => `   ${m.mes}: $${m.valor.toFixed(2)}`).join('\n')}

╔══════════════════════════════════════╗
║   DATOS HISTÓRICOS TOTALES          ║
╚══════════════════════════════════════╝
Total gastos históricos: $${totalGastosHistoricos.toFixed(2)}
Total ingresos históricos: $${totalIngresosHistoricos.toFixed(2)}
Balance histórico: $${(totalIngresosHistoricos - totalGastosHistoricos).toFixed(2)}
Total transacciones: ${allTransactions.length}
Meses con datos: ${mesesConDatos}

Promedios mensuales históricos:
- Gastos: $${promedioGastosMensual.toFixed(2)}
- Ingresos: $${promedioIngresosMensual.toFixed(2)}
- Balance: $${(promedioIngresosMensual - promedioGastosMensual).toFixed(2)}

Top 10 categorías de gastos (histórico):
${Object.entries(gastosHistoricosPorCategoria)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([cat, amount]) => `- ${cat}: $${amount.toFixed(2)} (prom. mensual: $${(amount / mesesConDatos).toFixed(2)})`)
  .join('\n')}

╔══════════════════════════════════════╗
║   DESGLOSE MENSUAL DETALLADO        ║
╚══════════════════════════════════════╝
${Object.entries(monthlyData)
  .sort((a, b) => b[0].localeCompare(a[0]))
  .slice(0, 24)
  .map(([month, data]) => {
    const [year, monthNum] = month.split('-');
    const monthName = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
      .toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    return `${monthName}: Gastos $${data.gastos.toFixed(2)} | Ingresos $${data.ingresos.toFixed(2)} | Balance $${(data.ingresos - data.gastos).toFixed(2)}`;
  })
  .join('\n')}

⚠️ INSTRUCCIONES OBLIGATORIAS ⚠️

CUANDO EL USUARIO PREGUNTE POR 2025:
1. USA los valores de "INGRESOS 2025 - VALORES EXACTOS POR MES" o "GASTOS 2025 - VALORES EXACTOS POR MES"
2. INCLUYE TODOS LOS 12 MESES en la gráfica (enero a diciembre)
3. NO inventes ni calcules otros valores
4. USA el "TOTAL INGRESOS 2025" y "PROMEDIO MENSUAL" que aparecen arriba

SI UN MES TIENE $0.00 = Ese mes tiene datos pero el valor es cero
SI UN MES NO APARECE EN DESGLOSE = No hay transacciones para ese mes
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
            content: `Eres Moni AI, un coach financiero personal amigable y motivador. Tu objetivo es ayudar a las personas a mejorar sus finanzas de manera divertida y educativa.

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
