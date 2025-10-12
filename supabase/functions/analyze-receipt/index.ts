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
    const { imageBase64, type } = await req.json();
    
    if (!imageBase64 || !type) {
      throw new Error('Missing required fields: imageBase64 and type');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Analyzing receipt as ${type}...`);

    const isIncome = type === 'ingreso';
    const categories = isIncome 
      ? ["Salario", "Ventas", "Freelance", "Inversiones", "Renta", "Regalo", "Reembolso", "Otro"]
      : ["Comida", "Transporte", "Entretenimiento", "Salud", "Compras", "Servicios", "Hogar", "Educación", "Ropa", "Tecnología", "Luz", "Agua", "Gas", "Teléfono", "Internet", "Otro"];

    // Call Lovable AI Gateway with vision model
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
            content: `Eres un asistente que analiza tickets y recibos. Extrae la información clave y categoriza el ${isIncome ? 'ingreso' : 'gasto'} según las categorías disponibles. Analiza cuidadosamente el ticket y extrae el monto total, descripción del comercio/establecimiento, y la fecha de la transacción si está disponible.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analiza este ticket/recibo y extrae: monto total, descripción/comercio, fecha (si está disponible), y sugiere la categoría más apropiada para un ${isIncome ? 'ingreso' : 'gasto'}.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_receipt_data",
              description: "Extrae los datos estructurados de un ticket de pago",
              parameters: {
                type: "object",
                properties: {
                  amount: {
                    type: "number",
                    description: "El monto total del ticket en números (sin símbolos de moneda)"
                  },
                  description: {
                    type: "string",
                    description: "El nombre del comercio o establecimiento, o una descripción del gasto/ingreso"
                  },
                  date: {
                    type: "string",
                    description: "La fecha de la transacción en formato YYYY-MM-DD, si está disponible. Si no está disponible, usa la fecha actual."
                  },
                  category: {
                    type: "string",
                    description: "La categoría sugerida para este gasto/ingreso",
                    enum: categories
                  },
                  payment_method: {
                    type: "string",
                    description: "Método de pago detectado o sugerido",
                    enum: ["efectivo", "debito", "credito", "transferencia"]
                  }
                },
                required: ["amount", "description", "date", "category", "payment_method"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_receipt_data" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido, intenta de nuevo más tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Pago requerido, por favor agrega fondos a tu workspace de Lovable AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Error al analizar el ticket");
    }

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data, null, 2));

    // Extract the tool call result
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'extract_receipt_data') {
      throw new Error('No se pudo extraer información del ticket');
    }

    const receiptData = JSON.parse(toolCall.function.arguments);
    console.log('Extracted receipt data:', receiptData);

    // Return just the extracted data (don't create transaction)
    return new Response(
      JSON.stringify(receiptData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Error in analyze-receipt function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Error desconocido al procesar el ticket"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
