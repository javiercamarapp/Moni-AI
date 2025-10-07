import { supabase } from "@/integrations/supabase/client";

/**
 * SECURITY CRITICAL: Bank Token Encryption
 * 
 * Encrypts bank access tokens using AES-256-GCM encryption via edge function.
 * The encryption key is stored securely in Supabase secrets.
 * 
 * ⚠️ NEVER store plaintext tokens
 * ⚠️ NEVER log the plaintext token
 * ⚠️ ALWAYS use this function before storing tokens
 * 
 * @param token - Plaintext bank access token from Plaid
 * @returns Base64-encoded encrypted token with IV
 * @throws Error if encryption fails
 */
export async function encryptBankToken(token: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('encrypt-bank-token', {
    body: { token, action: 'encrypt' }
  });

  if (error || !data?.encrypted) {
    throw new Error('Failed to encrypt bank token');
  }

  return data.encrypted;
}

/**
 * Decrypts a bank token from the database.
 * 
 * ⚠️ WARNING: This should ONLY be called from backend edge functions.
 * ⚠️ NEVER call this from client-side code.
 * ⚠️ Plaintext tokens should never exist on the client.
 * 
 * @param encryptedToken - Base64-encoded encrypted token from database
 * @returns Decrypted plaintext token
 * @throws Error if decryption fails
 */
export async function decryptBankToken(encryptedToken: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('encrypt-bank-token', {
    body: { token: encryptedToken, action: 'decrypt' }
  });

  if (error || !data?.decrypted) {
    throw new Error('Failed to decrypt bank token');
  }

  return data.decrypted;
}
