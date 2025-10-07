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
    const { token, action } = await req.json();
    const encryptionKey = Deno.env.get('BANK_TOKEN_ENCRYPTION_KEY');

    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    if (action === 'encrypt') {
      const encrypted = await encryptToken(token, encryptionKey);
      return new Response(JSON.stringify({ encrypted }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (action === 'decrypt') {
      const decrypted = await decryptToken(token, encryptionKey);
      return new Response(JSON.stringify({ decrypted }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error('Invalid action. Use "encrypt" or "decrypt"');
    }

  } catch (error) {
    console.error('Encryption error:', error);
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
