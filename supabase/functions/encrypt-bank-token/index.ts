import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function logAuditEvent(
  supabase: any,
  userId: string | null,
  action: string,
  status: string,
  metadata: any,
  req: Request
) {
  try {
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    await supabase.from('security_audit_log').insert({
      user_id: userId,
      action,
      timestamp: new Date().toISOString(),
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
      status
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { token, action, userId, itemId } = await req.json();
    const encryptionKey = Deno.env.get('BANK_TOKEN_ENCRYPTION_KEY');

    if (!encryptionKey) {
      await logAuditEvent(supabase, userId || null, `bank_token_${action}_failed`, 'error', 
        { reason: 'encryption_key_missing' }, req);
      throw new Error('Encryption key not configured');
    }

    if (action === 'encrypt') {
      const encrypted = await encryptToken(token, encryptionKey);
      await logAuditEvent(supabase, userId || null, 'bank_token_encrypted', 'success', 
        { item_id: itemId }, req);
      return new Response(JSON.stringify({ encrypted }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (action === 'decrypt') {
      const decrypted = await decryptToken(token, encryptionKey);
      await logAuditEvent(supabase, userId || null, 'bank_token_decrypted', 'success', 
        { item_id: itemId }, req);
      return new Response(JSON.stringify({ decrypted }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error('Invalid action. Use "encrypt" or "decrypt"');
    }

  } catch (error) {
    console.error('Encryption error:', error);
    await logAuditEvent(supabase, null, 'bank_token_operation_failed', 'error', 
      { error: error.message }, req);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function encryptToken(token: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  
  // Importar clave
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key.padEnd(32, '0').substring(0, 32)),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Generar IV aleatorio
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encriptar
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );

  // Combinar IV + datos encriptados y convertir a base64
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function decryptToken(encryptedToken: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  // Convertir de base64
  const combined = new Uint8Array(
    atob(encryptedToken).split('').map(c => c.charCodeAt(0))
  );
  
  // Separar IV y datos encriptados
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);
  
  // Importar clave
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key.padEnd(32, '0').substring(0, 32)),
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Desencriptar
  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encryptedData
  );

  return decoder.decode(decryptedData);
}
