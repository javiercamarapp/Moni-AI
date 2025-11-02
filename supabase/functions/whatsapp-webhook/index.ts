import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

function checkRateLimit(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (entry.count >= maxRequests) {
    return false;
  }
  
  entry.count++;
  return true;
}

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

// Verify WhatsApp signature
async function verifySignature(payload: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature || !signature.startsWith('sha256=')) return false;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedSignature = 'sha256=' + Array.from(new Uint8Array(signed))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return signature === expectedSignature;
}

async function logWebhookAttempt(supabase: any, phoneNumber: string, status: string, metadata: any) {
  try {
    await supabase.from('security_audit_log').insert({
      user_id: null,
      action: 'whatsapp_webhook_received',
      timestamp: new Date().toISOString(),
      metadata: { phone_number: phoneNumber, ...metadata },
      status
    });
  } catch (error) {
    console.error('Failed to log webhook attempt:', error);
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const whatsappSecret = Deno.env.get('WHATSAPP_APP_SECRET') || '';

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
    const rawBody = await req.text();
    
    // Verify webhook signature if secret is configured
    if (whatsappSecret) {
      const signature = req.headers.get('x-hub-signature-256');
      const isValid = await verifySignature(rawBody, signature, whatsappSecret);
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        await logWebhookAttempt(supabase, 'unknown', 'error', { reason: 'invalid_signature' });
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    const body = JSON.parse(rawBody);
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

    // Rate limiting - 100 requests per minute per phone number
    if (!checkRateLimit(sanitizedPhone, 100, 60000)) {
      console.error('Rate limit exceeded for:', sanitizedPhone);
      await logWebhookAttempt(supabase, sanitizedPhone, 'error', { reason: 'rate_limit_exceeded' });
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Message from ${sanitizedPhone}: ${sanitizedMessage}`);
    await logWebhookAttempt(supabase, sanitizedPhone, 'success', { message_length: sanitizedMessage.length });

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

    // Verificar si es una respuesta de aceptación de reto
    const acceptKeywords = ['acepto', 'aceptar', 'si', 'sí', 'ok', 'vale', 'dale', 'claro'];
    const isAcceptingChallenge = acceptKeywords.some(keyword => 
      sanitizedMessage.toLowerCase().includes(keyword)
    );

    if (isAcceptingChallenge) {
      const today = new Date().toISOString().split('T')[0];
      
      // Buscar reto pendiente del día
      const { data: pendingChallenge } = await supabase
        .from('user_daily_challenges')
        .select(`
          *,
          daily_challenges (*)
        `)
        .eq('user_id', whatsappUser.user_id)
        .eq('challenge_date', today)
        .eq('status', 'pending_verification')
        .maybeSingle();

      if (pendingChallenge) {
        // Activar el reto
        const { error: updateError } = await supabase
          .from('user_daily_challenges')
          .update({
            status: 'active',
            accepted_at: new Date().toISOString()
          })
          .eq('id', pendingChallenge.id);

        if (!updateError) {
          await sendWhatsAppMessage(sanitizedPhone, 
            `✅ ¡Perfecto! Reto activado: *${pendingChallenge.daily_challenges.title}*\n\n${pendingChallenge.daily_challenges.description}\n\n🤖 La IA verificará automáticamente si lo cumples al final del día. ¡Mucha suerte! 💪`
          );

          return new Response(JSON.stringify({ status: 'challenge_accepted' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          });
        }
      } else {
        await sendWhatsAppMessage(sanitizedPhone, 
          `ℹ️ No tienes retos pendientes por aceptar hoy. El próximo reto llegará mañana.`
        );

        return new Response(JSON.stringify({ status: 'no_pending_challenge' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
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
