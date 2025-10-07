import { supabase } from "@/integrations/supabase/client";
import { encryptBankToken } from "./bankEncryption";

/**
 * SECURITY CRITICAL: Bank Token Encryption
 * 
 * All bank access tokens MUST be encrypted before storage using AES-256-GCM encryption.
 * This file provides the ONLY approved method for storing bank connections.
 * 
 * ⚠️ NEVER store plaintext tokens in the database
 * ⚠️ NEVER bypass the insert_bank_connection_secure function
 * ⚠️ ALWAYS use encryptBankToken() before storage
 * 
 * The database enforces these rules with:
 * - CHECK constraints validating encryption format
 * - Secure insert function with validation
 * - Audit logging of all operations
 */

interface BankConnectionParams {
  bankName: string;
  accountId: string;
  plaintextToken: string;
  plaidItemId?: string;
}

/**
 * Securely creates a bank connection with encrypted token
 * 
 * @param params - Bank connection parameters
 * @returns The ID of the created connection
 * @throws Error if encryption fails or user is not authenticated
 * 
 * @example
 * ```typescript
 * const connectionId = await createBankConnection({
 *   bankName: "BBVA",
 *   accountId: "acc_123",
 *   plaintextToken: "access-sandbox-xyz",
 *   plaidItemId: "item_123"
 * });
 * ```
 */
export async function createBankConnection(
  params: BankConnectionParams
): Promise<string> {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('User must be authenticated to create bank connection');
  }

  // Encrypt the token using AES-256-GCM
  const encryptedToken = await encryptBankToken(params.plaintextToken);
  
  // Use secure database function to insert with validation
  const { data, error } = await supabase.rpc('insert_bank_connection_secure', {
    p_user_id: user.id,
    p_bank_name: params.bankName,
    p_account_id: params.accountId,
    p_encrypted_token: encryptedToken,
    p_plaid_item_id: params.plaidItemId || null
  });

  if (error) {
    console.error('Failed to create bank connection:', error);
    throw new Error(`Failed to create bank connection: ${error.message}`);
  }

  return data;
}

/**
 * Retrieves bank connections for the current user
 * Note: Tokens remain encrypted. Use decryptBankToken() only in backend edge functions.
 */
export async function getBankConnections() {
  const { data, error } = await supabase
    .from('bank_connections')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch bank connections:', error);
    throw new Error(`Failed to fetch bank connections: ${error.message}`);
  }

  return data;
}

/**
 * Deactivates a bank connection (soft delete)
 * Note: Does not delete the record to maintain audit trail
 */
export async function deactivateBankConnection(connectionId: string) {
  const { error } = await supabase
    .from('bank_connections')
    .update({ is_active: false })
    .eq('id', connectionId);

  if (error) {
    console.error('Failed to deactivate bank connection:', error);
    throw new Error(`Failed to deactivate bank connection: ${error.message}`);
  }
}
