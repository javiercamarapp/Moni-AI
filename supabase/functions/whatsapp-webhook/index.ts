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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificación de webhook de WhatsApp (GET)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'moni_verify_token';

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified');
        return new Response(challenge, { status: 200 });
      }
      
      return new Response('Forbidden', { status: 403 });
    }

    // Recepción de mensajes de WhatsApp (POST)
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Extraer mensaje y número de teléfono
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ status: 'no_messages' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const message = messages[0];
    const phoneNumber = message.from;
    const messageText = message.text?.body || '';

    console.log(`Message from ${phoneNumber}: ${messageText}`);

    // Buscar si el usuario está registrado
    const { data: whatsappUser } = await supabase
      .from('whatsapp_users')
      .select('user_id')
      .eq('phone_number', phoneNumber)
      .eq('is_active', true)
      .single();

    if (!whatsappUser) {
      // Usuario no registrado - enviar link de registro
      const registrationLink = `${supabaseUrl.replace('supabase.co', 'lovableproject.com')}/auth?whatsapp=${encodeURIComponent(phoneNumber)}`;
      
      await sendWhatsAppMessage(phoneNumber, 
        `👋 ¡Hola! Para usar Moni, necesitas registrarte primero.\n\n📱 Regístrate aquí: ${registrationLink}\n\nUna vez registrado, podrás enviar tus transacciones por WhatsApp y recibirás análisis automáticos. 🚀`
      );

      return new Response(JSON.stringify({ status: 'registration_required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Guardar mensaje para procesamiento
    const { error: messageError } = await supabase
      .from('whatsapp_messages')
      .insert({
        user_id: whatsappUser.user_id,
        phone_number: phoneNumber,
        message_text: messageText,
        processed: false
      });

    if (messageError) {
      console.error('Error saving message:', messageError);
      throw messageError;
    }

    // Procesar transacción con AI
    const { data: processResult, error: processError } = await supabase.functions.invoke('process-transaction', {
      body: { 
        messageText,
        userId: whatsappUser.user_id,
        phoneNumber
      }
    });

    if (processError) {
      console.error('Error processing transaction:', processError);
      await sendWhatsAppMessage(phoneNumber, 
        '❌ Hubo un error al procesar tu mensaje. Por favor intenta de nuevo.'
      );
    } else {
      console.log('Transaction processed:', processResult);
      await sendWhatsAppMessage(phoneNumber, 
        processResult.message || '✅ Transacción registrada correctamente'
      );
    }

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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
  }
}
