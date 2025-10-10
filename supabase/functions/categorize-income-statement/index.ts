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

    const systemPrompt = `Eres un contador experto que agrupa transacciones financieras en categorías significativas.

REGLAS DE AGRUPACIÓN:
1. Agrupa gastos similares en categorías generales (ej: todos los restaurantes → "Comidas y Restaurantes")
2. Agrupa salidas, bares, fiestas → "Entretenimiento y Vida Nocturna"
3. Transporte (Uber, gasolina, estacionamiento) → "Transporte"
4. Supermercados y tiendas → "Supermercado y Despensa"
5. Servicios (luz, agua, gas, internet) → "Servicios Básicos"
6. Suscripciones (Netflix, Spotify, etc.) → "Suscripciones Digitales"
7. Salud (farmacia, doctor, gym) → "Salud y Bienestar"
8. Vivienda (renta, mantenimiento) → "Vivienda"

Para INGRESOS:
1. Salario → "Salario"
2. Freelance/consultoría → "Ingresos Profesionales"
3. Ventas → "Ventas"
4. Otros → Agrupa de forma inteligente

IMPORTANTE:
- Suma todos los montos de transacciones que pertenezcan a la misma categoría
- Devuelve categorías ordenadas de mayor a menor monto
- Usa nombres de categorías en español, claros y profesionales`;

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
                      transacciones: { type: "number" }
                    },
                    required: ["categoria", "monto", "transacciones"]
                  }
                },
                gastos: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      categoria: { type: "string" },
                      monto: { type: "number" },
                      transacciones: { type: "number" }
                    },
                    required: ["categoria", "monto", "transacciones"]
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
