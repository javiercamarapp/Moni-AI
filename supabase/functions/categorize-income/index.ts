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
    const { transactions } = await req.json();
    
    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ categorizedIncome: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurado');
    }

    // Categorías predeterminadas de ingresos
    const incomeCategories = [
      '💼 Salario / Sueldo',
      '💰 Bonos / Comisiones',
      '💸 Freelance / Servicios',
      '📈 Inversiones',
      '🏠 Rentas',
      '🎁 Regalos / Donaciones recibidas',
      '💳 Reembolsos',
      '🚗 Venta de bienes',
      '🧠 Educación o becas',
      '🌐 Ingresos digitales',
      '🪙 Cripto / NFT',
      '🤝 Sociedades / Dividendos empresariales'
    ];

    const systemPrompt = `Eres un asistente financiero experto en categorizar ingresos.
Analiza cada transacción de ingreso y asígnale UNA de estas categorías:

${incomeCategories.map((cat, i) => `${i + 1}. ${cat}`).join('\n')}

Reglas:
- Salarios y sueldos fijos → 💼 Salario / Sueldo
- Bonos, comisiones por ventas → 💰 Bonos / Comisiones  
- Trabajos freelance, consultoría, servicios independientes → 💸 Freelance / Servicios
- Dividendos, intereses, ganancias de inversiones → 📈 Inversiones
- Rentas de propiedades, Airbnb → 🏠 Rentas
- Regalos, ayuda familiar, donaciones → 🎁 Regalos / Donaciones recibidas
- Reembolsos de gastos, devoluciones → 💳 Reembolsos
- Venta de autos, electrónicos, muebles → 🚗 Venta de bienes
- Becas, apoyo estudiantil → 🧠 Educación o becas
- YouTube, TikTok, OnlyFans, Patreon → 🌐 Ingresos digitales
- Cripto trading, NFTs, staking → 🪙 Cripto / NFT
- Dividendos empresariales, utilidades → 🤝 Sociedades / Dividendos empresariales

Responde usando la función categorize_income.`;

    const userPrompt = `Categoriza estos ingresos:

${transactions.map((t: any, i: number) => 
  `${i + 1}. Descripción: "${t.description}" | Monto: $${t.amount}`
).join('\n')}`;

    console.log('📊 Categorizando', transactions.length, 'ingresos con IA...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'categorize_income',
            description: 'Categoriza ingresos en las categorías predeterminadas',
            parameters: {
              type: 'object',
              properties: {
                categorizations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      transactionIndex: { type: 'number' },
                      category: { type: 'string' },
                      confidence: { type: 'string', enum: ['alta', 'media', 'baja'] }
                    },
                    required: ['transactionIndex', 'category', 'confidence']
                  }
                }
              },
              required: ['categorizations']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'categorize_income' } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error de Lovable AI:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de solicitudes excedido. Intenta de nuevo más tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Error de IA: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('❌ No se recibió tool call de la IA');
      throw new Error('Respuesta inválida de la IA');
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // Mapear resultados a transacciones
    const categorizedIncome = transactions.map((t: any, index: number) => {
      const categorization = result.categorizations.find(
        (c: any) => c.transactionIndex === index + 1
      );
      
      return {
        id: t.id,
        description: t.description,
        amount: t.amount,
        transaction_date: t.transaction_date,
        category: categorization?.category || '💼 Salario / Sueldo', // Fallback
        confidence: categorization?.confidence || 'baja'
      };
    });

    console.log('✅ Ingresos categorizados:', categorizedIncome.length);

    return new Response(
      JSON.stringify({ categorizedIncome }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error en categorize-income:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
