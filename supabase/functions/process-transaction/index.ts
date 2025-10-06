import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageText, userId, phoneNumber } = await req.json();
    
    console.log('Processing transaction:', { messageText, userId, phoneNumber });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener categorías del usuario
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, type')
      .eq('user_id', userId);

    const categoriesInfo = categories?.map(c => `${c.name} (${c.type})`).join(', ') || 'ninguna';

    // Usar Lovable AI para interpretar el mensaje
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente financiero que interpreta mensajes de WhatsApp sobre transacciones de dinero.
            
Categorías disponibles del usuario: ${categoriesInfo}

Extrae la siguiente información del mensaje y responde SOLO con un JSON válido:
{
  "type": "ingreso" o "gasto",
  "amount": número (solo el monto sin símbolos),
  "description": descripción breve,
  "category": nombre de la categoría más apropiada de las disponibles (o sugiere una nueva si ninguna aplica),
  "confidence": "high", "medium" o "low",
  "suggested_category": si sugieres una nueva categoría, ponla aquí
}

Si no puedes interpretar el mensaje como una transacción, responde:
{
  "error": "No pude identificar una transacción en tu mensaje. Por favor especifica si es un ingreso o gasto y el monto."
}`
          },
          {
            role: 'user',
            content: messageText
          }
        ],
        temperature: 0.3
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('AI interpretation:', aiContent);

    let interpretation;
    try {
      // Limpiar el contenido para obtener solo el JSON
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      interpretation = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Error al interpretar la respuesta de la IA');
    }

    if (interpretation.error) {
      return new Response(JSON.stringify({ 
        success: false,
        message: interpretation.error 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar o sugerir categoría
    let categoryId = null;
    if (categories && categories.length > 0) {
      const matchedCategory = categories.find(c => 
        c.name.toLowerCase() === interpretation.category.toLowerCase() &&
        c.type === interpretation.type
      );
      
      if (matchedCategory) {
        categoryId = matchedCategory.id;
      } else if (interpretation.suggested_category) {
        // Crear nueva categoría sugerida por la IA
        const { data: newCategory } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: interpretation.suggested_category,
            type: interpretation.type,
            color: interpretation.type === 'ingreso' ? 'bg-primary/20' : 'bg-destructive/20'
          })
          .select()
          .single();
        
        if (newCategory) {
          categoryId = newCategory.id;
        }
      }
    }

    // Guardar transacción
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: interpretation.type,
        amount: interpretation.amount,
        description: interpretation.description,
        category_id: categoryId,
        transaction_date: new Date().toISOString().split('T')[0],
        payment_method: 'whatsapp'
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error saving transaction:', transactionError);
      throw transactionError;
    }

    // Actualizar mensaje como procesado
    await supabase
      .from('whatsapp_messages')
      .update({
        processed: true,
        transaction_id: transaction.id,
        ai_interpretation: interpretation
      })
      .eq('user_id', userId)
      .eq('phone_number', phoneNumber)
      .eq('message_text', messageText);

    // Verificar preferencias de notificación del usuario
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('spending_alerts, transaction_alert_threshold, daily_spending_limit, quiet_hours_start, quiet_hours_end')
      .eq('user_id', userId)
      .single();

    let shouldSendAlert = false;
    let alertMessage = '';

    if (settings && settings.spending_alerts && interpretation.type === 'gasto') {
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
      
      // Función para verificar horario silencioso
      const isInQuietHours = (quietStart: string, quietEnd: string): boolean => {
        if (!quietStart || !quietEnd) return false;
        const [currentH, currentM] = currentTime.split(':').map(Number);
        const [startH, startM] = quietStart.substring(0, 5).split(':').map(Number);
        const [endH, endM] = quietEnd.substring(0, 5).split(':').map(Number);
        const current = currentH * 60 + currentM;
        const start = startH * 60 + startM;
        const end = endH * 60 + endM;
        if (start > end) return current >= start || current <= end;
        return current >= start && current <= end;
      };

      const inQuietHours = isInQuietHours(
        settings.quiet_hours_start || '22:00',
        settings.quiet_hours_end || '08:00'
      );

      if (!inQuietHours) {
        // Alerta por transacción grande
        if (interpretation.amount >= (settings.transaction_alert_threshold || 500)) {
          shouldSendAlert = true;
          alertMessage = `⚠️ Alerta: Gasto grande detectado de $${interpretation.amount}`;
        }

        // Verificar límite diario
        const today = new Date().toISOString().split('T')[0];
        const { data: todayTransactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', userId)
          .eq('type', 'gasto')
          .eq('transaction_date', today);

        if (todayTransactions) {
          const totalToday = todayTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
          const dailyLimit = settings.daily_spending_limit || 1000;
          
          if (totalToday >= dailyLimit) {
            shouldSendAlert = true;
            alertMessage = `🚨 Has alcanzado tu límite diario de gastos ($${dailyLimit})\nTotal hoy: $${totalToday}`;
          } else if (totalToday >= dailyLimit * 0.8) {
            shouldSendAlert = true;
            alertMessage = `⚠️ Cerca del límite diario ($${dailyLimit})\nGastado: $${totalToday} (${Math.round((totalToday/dailyLimit)*100)}%)`;
          }
        }
      }
    }

    const responseMessage = `✅ ${interpretation.type === 'ingreso' ? 'Ingreso' : 'Gasto'} registrado
💰 Monto: $${interpretation.amount}
📝 ${interpretation.description}
📊 Categoría: ${interpretation.category}${shouldSendAlert ? '\n\n' + alertMessage : ''}`;

    return new Response(JSON.stringify({ 
      success: true,
      message: responseMessage,
      transaction,
      interpretation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Process transaction error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
