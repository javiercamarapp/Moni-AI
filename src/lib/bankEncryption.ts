import { supabase } from "@/integrations/supabase/client";

/**
 * CRITICAL SECURITY: Bank Token Encryption
 * 
 * All Plaid bank access tokens MUST be encrypted before storage using AES-256-GCM.
 * See BANK_TOKEN_SECURITY.md for full documentation.
 */

/**
 * Encrypts a bank access token before storage in the database.
 * 
 * @param token - Plain text Plaid access token
 * @returns Base64-encoded encrypted token (IV + ciphertext)
 * @throws Error if encryption fails
 * 
 * @example
 * const encrypted = await encryptBankToken(plaidAccessToken);
 * // Use encrypted token with insert_bank_connection_secure()
 */
export async function encryptBankToken(token: string): Promise<string> {
  if (!token || token.trim().length === 0) {
    throw new Error('Token cannot be empty');
  }

  const { data, error } = await supabase.functions.invoke('encrypt-bank-token', {
    body: { token, action: 'encrypt' }
  });

  if (error || !data?.encrypted) {
    console.error('Bank token encryption failed:', error);
    throw new Error('Failed to encrypt bank token - check BANK_TOKEN_ENCRYPTION_KEY is configured');
  }

  return data.encrypted;
}

/**
 * Decrypts a bank access token retrieved from the database.
 * 
 * ⚠️ WARNING: This should only be called from server-side edge functions.
 * Client-side code should never have access to decrypted tokens.
 * 
 * @param encryptedToken - Base64-encoded encrypted token from database
 * @returns Plain text Plaid access token
 * @throws Error if decryption fails
 */
export async function decryptBankToken(encryptedToken: string): Promise<string> {
  if (!encryptedToken || encryptedToken.trim().length === 0) {
    throw new Error('Encrypted token cannot be empty');
  }

  const { data, error } = await supabase.functions.invoke('encrypt-bank-token', {
    body: { token: encryptedToken, action: 'decrypt' }
  });

  if (error || !data?.decrypted) {
    console.error('Bank token decryption failed:', error);
    throw new Error('Failed to decrypt bank token');
  }

  return data.decrypted;
}

/**
 * Helper function to securely store an encrypted bank connection.
 * 
 * This uses the database's insert_bank_connection_secure() function which:
 * - Validates the token is properly encrypted
 * - Verifies user authentication
 * - Logs the operation to audit trail
 * 
 * @param params - Connection parameters
 * @returns Connection ID
 * @throws Error if storage fails or validation fails
 * 
 * @example
 * const connectionId = await storeBankConnection({
 *   userId: user.id,
 *   bankName: 'Chase',
 *   accountId: 'acc_123',
 *   encryptedToken: await encryptBankToken(accessToken),
 *   plaidItemId: 'item_456'
 * });
 */
export async function storeBankConnection(params: {
  userId: string;
  bankName: string;
  accountId: string;
  encryptedToken: string;
  plaidItemId?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('insert_bank_connection_secure', {
    p_user_id: params.userId,
    p_bank_name: params.bankName,
    p_account_id: params.accountId,
    p_encrypted_token: params.encryptedToken,
    p_plaid_item_id: params.plaidItemId || null
  });

  if (error) {
    console.error('Failed to store bank connection:', error);
    throw new Error(`Failed to store bank connection: ${error.message}`);
  }

  return data;
}
