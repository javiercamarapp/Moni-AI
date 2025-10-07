import { supabase } from "@/integrations/supabase/client";

/**
 * Encripta un token bancario antes de guardarlo en la base de datos
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
 * Desencripta un token bancario recuperado de la base de datos
 * (Normalmente no se necesita en el cliente, solo en edge functions)
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
