import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, userId } = await req.json();
    
    if (!imageBase64 || !userId) {
      throw new Error('Missing required fields: imageBase64 and userId');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Analyzing receipt for user:', userId);

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
            content: "Eres un asistente que analiza tickets de compra. Extrae la información clave y categoriza el gasto según las categorías comunes: Comida, Transporte, Entretenimiento, Salud, Compras, Servicios, Hogar, Educación, Ropa, Tecnología, Luz, Agua, Gas, Teléfono, Internet, Otro. Analiza cuidadosamente el ticket y extrae el monto total, descripción del comercio/establecimiento, y la fecha de la transacción si está disponible."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analiza este ticket de pago y extrae: monto total, descripción/comercio, fecha (si está disponible), y sugiere la categoría más apropiada."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
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
                    description: "El nombre del comercio o establecimiento, o una descripción del gasto"
                  },
                  date: {
                    type: "string",
                    description: "La fecha de la transacción en formato YYYY-MM-DD, si está disponible. Si no está disponible, usa la fecha actual."
                  },
                  category: {
                    type: "string",
                    description: "La categoría sugerida para este gasto",
                    enum: ["Comida", "Transporte", "Entretenimiento", "Salud", "Compras", "Servicios", "Hogar", "Educación", "Ropa", "Tecnología", "Luz", "Agua", "Gas", "Teléfono", "Internet", "Otro"]
                  },
                  confidence: {
                    type: "string",
                    description: "Nivel de confianza en la extracción: high, medium, low",
                    enum: ["high", "medium", "low"]
                  }
                },
                required: ["amount", "description", "date", "category", "confidence"],
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

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find or create the category
    let categoryId = null;
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', receiptData.category)
      .eq('type', 'expense')
      .maybeSingle();

    if (existingCategory) {
      categoryId = existingCategory.id;
    } else {
      // Create new category if it doesn't exist
      const { data: newCategory, error: categoryError } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: receiptData.category,
          type: 'expense',
          color: 'bg-primary/20'
        })
        .select('id')
        .single();

      if (categoryError) {
        console.error('Error creating category:', categoryError);
      } else {
        categoryId = newCategory.id;
      }
    }

    // Insert the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'expense',
        amount: receiptData.amount,
        description: receiptData.description,
        transaction_date: receiptData.date,
        category_id: categoryId,
        payment_method: 'Tarjeta' // Default payment method
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      throw new Error('Error al guardar la transacción: ' + transactionError.message);
    }

    console.log('Transaction created:', transaction);

    return new Response(
      JSON.stringify({
        success: true,
        transaction,
        receiptData,
        message: `Ticket analizado: $${receiptData.amount} en ${receiptData.category} - ${receiptData.description}`
      }),
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
