import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Input validation functions
const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

const sanitizeString = (str: string, maxLength: number): string => {
  return str.trim().slice(0, maxLength);
};

const isValidVerifyToken = (token: string): boolean => {
  return typeof token === 'string' && token.length > 0 && token.length <= 100;
};

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

      const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
      
      // Security: No fallback token - must be configured
      if (!VERIFY_TOKEN) {
        console.error('WHATSAPP_VERIFY_TOKEN not configured');
        return new Response('Server configuration error', { 
          status: 500,
          headers: corsHeaders 
        });
      }

      // Validate token format
      if (!token || !isValidVerifyToken(token)) {
        console.error('Invalid verify token format');
        return new Response('Invalid token', { 
          status: 400,
          headers: corsHeaders 
        });
      }

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified');
        return new Response(challenge, { 
          status: 200,
          headers: corsHeaders 
        });
      }
      
      return new Response('Forbidden', { 
        status: 403,
        headers: corsHeaders 
      });
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

    // Validate phone number
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      console.error('Invalid phone number format:', phoneNumber);
      return new Response(
        JSON.stringify({ error: 'Invalid phone number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate message text
    if (!messageText || typeof messageText !== 'string' || messageText.trim().length === 0) {
      console.error('Invalid message text');
      return new Response(
        JSON.stringify({ error: 'Invalid message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (messageText.length > 1000) {
      console.error('Message too long:', messageText.length);
      await sendWhatsAppMessage(phoneNumber, '❌ El mensaje es demasiado largo. Por favor, envía un mensaje más corto.');
      return new Response(
        JSON.stringify({ error: 'Message too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedPhone = sanitizeString(phoneNumber, 20);
    const sanitizedMessage = sanitizeString(messageText, 1000);

    console.log(`Message from ${sanitizedPhone}: ${sanitizedMessage}`);

    // Buscar si el usuario está registrado
    const { data: whatsappUser } = await supabase
      .from('whatsapp_users')
      .select('user_id')
      .eq('phone_number', sanitizedPhone)
      .eq('is_active', true)
      .single();

    if (!whatsappUser) {
      // Usuario no registrado - enviar link de registro
      const registrationLink = `${supabaseUrl.replace('supabase.co', 'lovableproject.com')}/auth?whatsapp=${encodeURIComponent(sanitizedPhone)}`;
      
      await sendWhatsAppMessage(sanitizedPhone, 
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
        phone_number: sanitizedPhone,
        message_text: sanitizedMessage,
        processed: false
      });

    if (messageError) {
      console.error('Error saving message:', messageError);
      throw messageError;
    }

    // Procesar transacción con AI
    const { data: processResult, error: processError } = await supabase.functions.invoke('process-transaction', {
      body: { 
        messageText: sanitizedMessage,
        userId: whatsappUser.user_id,
        phoneNumber: sanitizedPhone
      }
    });

    if (processError) {
      console.error('Error processing transaction:', processError);
      await sendWhatsAppMessage(sanitizedPhone, 
        '❌ Hubo un error al procesar tu mensaje. Por favor intenta de nuevo.'
      );
    } else {
      console.log('Transaction processed:', processResult);
      await sendWhatsAppMessage(sanitizedPhone, 
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
