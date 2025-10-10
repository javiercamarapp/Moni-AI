import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions } = await req.json();
    
    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          ingresos: [],
          gastos: [],
          totalIngresos: 0,
          totalGastos: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Preparar datos para la IA
    const transactionList = transactions.map((t: any) => ({
      descripcion: t.description || t.descripcion,
      monto: t.amount || t.monto,
      tipo: t.type || t.tipo,
      categoria: t.category_name || t.categoria
    }));

    const systemPrompt = `Eres un contador experto que crea estados de resultados profesionales agrupando transacciones.

REGLAS CRÍTICAS DE AGRUPACIÓN:
1. DEBES agrupar TODAS las transacciones similares en UNA SOLA categoría
2. SUMA todos los montos de transacciones similares
3. Crea una estructura jerárquica con categorías principales y subcuentas

CATEGORÍAS PARA GASTOS:
- "Gastos de Alimentación": Restaurantes, comida rápida, cafés, delivery, supermercado
- "Gastos de Transporte": Uber, taxis, gasolina, estacionamiento, mantenimiento auto
- "Entretenimiento y Ocio": Bares, fiestas, cine, eventos, salidas nocturnas
- "Servicios Básicos": Luz, agua, gas, internet, teléfono
- "Suscripciones": Netflix, Spotify, Amazon Prime, Disney+, HBO, apps
- "Salud y Bienestar": Farmacia, doctor, dentista, gym, seguro médico
- "Vivienda": Renta, mantenimiento, muebles
- "Compras y Shopping": Ropa, electrónicos, accesorios
- "Educación": Cursos, libros, material escolar
- "Otros Gastos": Todo lo que no encaje arriba

CATEGORÍAS PARA INGRESOS:
- "Ingresos por Salario": Sueldos, nómina
- "Ingresos Profesionales": Freelance, consultoría, servicios
- "Ventas": Productos vendidos
- "Otros Ingresos": Inversiones, intereses, regalos

FORMATO DE RESPUESTA:
- Cada categoría debe tener subcuentas agrupadas
- Ejemplo: "Gastos de Alimentación" incluye: "Restaurantes", "Supermercado", "Cafés"
- SUMA los montos de transacciones similares en cada subcuenta
- NO repitas subcuentas, agrúpalas todas en una sola línea`;


    const userPrompt = `Analiza estas transacciones y agrúpalas en categorías inteligentes:

${JSON.stringify(transactionList, null, 2)}

Devuelve el resultado agrupado y sumado por categorías.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "categorize_transactions",
            description: "Agrupa y categoriza transacciones en categorías inteligentes",
            parameters: {
              type: "object",
              properties: {
                ingresos: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      categoria: { type: "string" },
                      monto: { type: "number" },
                      subcuentas: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            nombre: { type: "string" },
                            monto: { type: "number" }
                          }
                        }
                      }
                    },
                    required: ["categoria", "monto", "subcuentas"]
                  }
                },
                gastos: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      categoria: { type: "string" },
                      monto: { type: "number" },
                      subcuentas: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            nombre: { type: "string" },
                            monto: { type: "number" }
                          }
                        }
                      }
                    },
                    required: ["categoria", "monto", "subcuentas"]
                  }
                }
              },
              required: ["ingresos", "gastos"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "categorize_transactions" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta más tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Fondos insuficientes. Agrega créditos a tu cuenta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No se recibió categorización de la IA");
    }

    const categorizedData = JSON.parse(toolCall.function.arguments);
    
    // Calcular totales
    const totalIngresos = categorizedData.ingresos.reduce((sum: number, cat: any) => sum + cat.monto, 0);
    const totalGastos = categorizedData.gastos.reduce((sum: number, cat: any) => sum + cat.monto, 0);

    return new Response(
      JSON.stringify({
        ingresos: categorizedData.ingresos.sort((a: any, b: any) => b.monto - a.monto),
        gastos: categorizedData.gastos.sort((a: any, b: any) => b.monto - a.monto),
        totalIngresos,
        totalGastos,
        balance: totalIngresos - totalGastos
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error en categorización:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
