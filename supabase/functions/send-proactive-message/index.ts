import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function sanitizeString(str: string, maxLength: number): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, type, data } = await req.json();
    
    // Input validation
    if (!userId || typeof userId !== 'string' || !isValidUUID(userId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid userId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const validTypes = [
      'spending_alert', 'daily_limit_exceeded', 'savings_tip', 
      'goal_reminder', 'weekly_summary', 'daily_summary'
    ];
    
    if (!type || typeof type !== 'string' || !validTypes.includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid notification type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Sending proactive message:', { userId, type });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener número de WhatsApp del usuario
    const { data: whatsappUser } = await supabase
      .from('whatsapp_users')
      .select('phone_number')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (!whatsappUser) {
      console.log('User does not have WhatsApp connected');
      return new Response(JSON.stringify({ status: 'no_whatsapp' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Obtener configuración de notificaciones
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Verificar horarios de silencio
    if (settings) {
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
      
      if (currentTime >= settings.quiet_hours_start || currentTime <= settings.quiet_hours_end) {
        console.log('In quiet hours, skipping notification');
        return new Response(JSON.stringify({ status: 'quiet_hours' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
    }

    // Generar mensaje personalizado con IA
    const message = await generateProactiveMessage(type, data, userId);

    // Enviar mensaje por WhatsApp
    await sendWhatsAppMessage(whatsappUser.phone_number, message);

    // Guardar en historial
    await supabase
      .from('notification_history')
      .insert({
        user_id: userId,
        notification_type: type,
        message,
        status: 'sent',
        metadata: data
      });

    return new Response(JSON.stringify({ 
      success: true,
      message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Proactive message error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateProactiveMessage(type: string, data: any, userId: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return getDefaultMessage(type, data);
  }

  const prompts: Record<string, string> = {
    spending_alert: `Se detectó un gasto importante de $${data.amount} en ${data.description}. Genera un mensaje amigable pero preocupado alertando al usuario.`,
    daily_limit_exceeded: `El usuario ha gastado $${data.spent} hoy, superando su límite de $${data.limit}. Genera un mensaje motivador pero firme para que controle sus gastos.`,
    savings_tip: `Genera un consejo de ahorro personalizado y motivador para el usuario.`,
    goal_reminder: `El usuario tiene una meta de ahorro pendiente. Genera un recordatorio motivador.`,
    weekly_summary: `Genera un resumen semanal amigable y motivador de las finanzas del usuario.`,
    spending_pattern: `Se detectó un patrón de gasto inusual. Genera un mensaje de alerta amigable.`,
    discount_opportunity: `Hay una oportunidad de descuento en ${data.category}. Genera un mensaje promocional.`
  };

  try {
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
            content: `Eres Moni, un coach financiero amigable y motivador que envía mensajes por WhatsApp.
            
Genera mensajes:
- Cortos y directos (máximo 3-4 líneas)
- Con emojis apropiados
- Tono amigable pero profesional
- Motivadores y accionables
- En español mexicano`
          },
          {
            role: 'user',
            content: prompts[type] || `Genera un mensaje para: ${type}`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!aiResponse.ok) {
      throw new Error('AI API error');
    }

    const aiData = await aiResponse.json();
    return aiData.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating AI message:', error);
    return getDefaultMessage(type, data);
  }
}

function getDefaultMessage(type: string, data: any): string {
  const messages: Record<string, string> = {
    spending_alert: `🚨 ¡Alerta! Se registró un gasto de $${data.amount} en ${data.description}. ¿Fue planeado? 💰`,
    daily_limit_exceeded: `⚠️ Has gastado $${data.spent} hoy, superando tu límite de $${data.limit}. ¡Cuidado con tus finanzas! 💸`,
    savings_tip: `💡 Tip de ahorro: Pequeños cambios en tus hábitos pueden generar grandes ahorros. ¡Tú puedes! 🌟`,
    goal_reminder: `🎯 Recuerda tu meta de ahorro. ¡Cada peso cuenta para lograr tus objetivos! 💪`,
    weekly_summary: `📊 Resumen semanal: Revisa tus finanzas y ajusta tu plan si es necesario. ¡Vas bien! ✨`,
  };

  return messages[type] || '📱 Tienes una actualización financiera en Moni.';
}

async function sendWhatsAppMessage(to: string, message: string) {
  const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN');
  const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.error('WhatsApp credentials not configured');
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message }
        })
      }
    );

    const result = await response.json();
    console.log('WhatsApp message sent:', result);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}
