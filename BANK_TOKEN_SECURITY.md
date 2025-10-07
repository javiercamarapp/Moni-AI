# Bank Token Security Implementation

## ⚠️ CRITICAL SECURITY REQUIREMENT

**ALL bank access tokens MUST be encrypted before storage in the database.**

This project implements AES-256-GCM encryption for Plaid bank access tokens to protect user financial data.

## How It Works

### 1. Client-Side Encryption
When a bank connection is created, the access token must be encrypted using the `encryptBankToken()` function:

```typescript
import { encryptBankToken } from "@/lib/bankEncryption";

// Encrypt the token before storing
const encryptedToken = await encryptBankToken(plainTextAccessToken);
```

### 2. Secure Database Storage
Use the `insert_bank_connection_secure()` database function to store encrypted tokens:

```typescript
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.rpc('insert_bank_connection_secure', {
  p_user_id: userId,
  p_bank_name: bankName,
  p_account_id: accountId,
  p_encrypted_token: encryptedToken,
  p_plaid_item_id: itemId // optional
});
```

The database function will:
- ✅ Validate the token is properly encrypted (base64, min 32 chars)
- ✅ Verify the user is authenticated
- ✅ Log the operation to the security audit log
- ✅ Insert the connection with the encrypted token

### 3. Server-Side Decryption
Edge functions decrypt tokens using the `encrypt-bank-token` function:

```typescript
const { data } = await supabase.functions.invoke('encrypt-bank-token', {
  body: { token: encryptedToken, action: 'decrypt' }
});

const plainTextToken = data.decrypted;
```

## Security Features

### Database-Level Protection
1. **Constraint Validation**: The `access_token` column has a CHECK constraint ensuring only properly formatted encrypted tokens can be stored
2. **Function-Only Inserts**: Direct INSERT statements are blocked; only the secure function can add connections
3. **Audit Trail**: All bank connection operations are logged to `security_audit_log`

### Encryption Details
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Length**: 256 bits
- **IV**: 12 bytes random (generated per encryption)
- **Format**: Base64-encoded (IV + encrypted data)

### Environment Variables
The encryption key is stored as a Supabase secret:
- `BANK_TOKEN_ENCRYPTION_KEY`: 32+ character encryption key

## Integration Example

```typescript
import { supabase } from "@/integrations/supabase/client";
import { encryptBankToken } from "@/lib/bankEncryption";

async function connectBank(plaidPublicToken: string, metadata: any) {
  // 1. Exchange public token for access token (via Plaid)
  const response = await fetch('/api/plaid/token-exchange', {
    method: 'POST',
    body: JSON.stringify({ public_token: plaidPublicToken })
  });
  
  const { access_token, item_id } = await response.json();
  
  // 2. Encrypt the access token
  const encryptedToken = await encryptBankToken(access_token);
  
  // 3. Store securely in database
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase.rpc('insert_bank_connection_secure', {
    p_user_id: user.id,
    p_bank_name: metadata.institution.name,
    p_account_id: metadata.accounts[0].id,
    p_encrypted_token: encryptedToken,
    p_plaid_item_id: item_id
  });
  
  if (error) {
    console.error('Failed to save bank connection:', error);
    throw error;
  }
  
  return data; // Returns the connection ID
}
```

## Audit Logs

All bank token operations are logged to `security_audit_log`:

- `bank_token_encrypted`: Token was encrypted
- `bank_token_decrypted`: Token was decrypted
- `bank_connection_created`: Connection was created
- `bank_connection_inserted`: Direct insert (should not happen)
- `bank_connection_updated`: Connection was modified
- `bank_connection_deleted`: Connection was removed

Query audit logs:
```sql
SELECT * FROM security_audit_log 
WHERE action LIKE 'bank_%' 
ORDER BY timestamp DESC;
```

## Security Checklist

Before deploying:
- ✅ `BANK_TOKEN_ENCRYPTION_KEY` is set in Supabase secrets
- ✅ All bank connections use `insert_bank_connection_secure()` function
- ✅ Tokens are encrypted client-side before storage
- ✅ Edge functions decrypt tokens only when needed
- ✅ Audit logs are monitored for suspicious activity
- ✅ Database backups are encrypted
- ✅ RLS policies are enabled on `bank_connections` table

## Compliance Notes

This implementation helps meet:
- **PCI DSS**: Encryption of cardholder data
- **GDPR**: Appropriate technical measures for data protection
- **SOC 2**: Encryption of sensitive data at rest
- **CCPA**: Reasonable security procedures

⚠️ **Important**: This is one layer of security. Always follow industry best practices for:
- Network security (HTTPS, VPN)
- Access controls (RLS policies, authentication)
- Monitoring and alerting
- Incident response planning
