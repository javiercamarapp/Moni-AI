# Bank Token Security Architecture

## Overview

This application handles highly sensitive bank access tokens (Plaid access tokens) that provide direct access to users' financial accounts. **Improper handling of these tokens could result in unauthorized access to user bank accounts.**

## Security Measures Implemented

### 1. Client-Side Encryption (AES-256-GCM)

All bank tokens are encrypted before being sent to the database using AES-256-GCM encryption:

- **File**: `src/lib/bankEncryption.ts`
- **Function**: `encryptBankToken(token: string)`
- **Edge Function**: `supabase/functions/encrypt-bank-token/index.ts`
- **Algorithm**: AES-256-GCM with random IV
- **Key Storage**: Environment variable `BANK_TOKEN_ENCRYPTION_KEY` (32+ characters)

### 2. Database-Level Validation

The `bank_connections` table enforces encryption:

```sql
-- Ensures tokens are at least 32 chars and base64-encoded
ALTER TABLE bank_connections 
ADD CONSTRAINT access_token_encrypted_check 
CHECK (length(access_token) >= 32 AND access_token ~ '^[A-Za-z0-9+/=]+$');
```

### 3. Secure Insert Function

Direct inserts are blocked. All connections must use:

```typescript
import { createBankConnection } from '@/lib/bankConnection';

const connectionId = await createBankConnection({
  bankName: "BBVA",
  accountId: "acc_123",
  plaintextToken: "access-sandbox-xyz" // Will be encrypted automatically
});
```

The function:
- Validates encryption format
- Verifies user authentication
- Logs to security audit trail
- Returns connection ID

### 4. Audit Logging

All bank connection operations are logged to `security_audit_log`:

- `bank_connection_created` - New connection added
- `bank_connection_inserted` - Direct insert (should never happen)
- `bank_connection_updated` - Connection modified
- `bank_connection_deleted` - Connection removed
- `bank_token_encrypted` - Token encrypted
- `bank_token_decrypted` - Token decrypted (backend only)

### 5. Row-Level Security (RLS)

- Users can only view their own connections
- Users can only update their own connections
- Users can only delete their own connections
- Direct inserts are blocked (must use secure function)

## Token Lifecycle

### Storage (Client-Side)

1. User completes Plaid Link flow
2. Plaid returns `access_token` (plaintext)
3. Client calls `encryptBankToken(access_token)`
4. Encrypted token sent to `insert_bank_connection_secure()`
5. Database stores encrypted token
6. Plaintext token is never logged or stored

### Retrieval (Backend Only)

Decryption should **ONLY** happen in backend edge functions:

```typescript
// In edge function (NOT client-side)
import { supabase } from 'https://esm.sh/@supabase/supabase-js@2';

const { data: decryptResult } = await supabase.functions.invoke('encrypt-bank-token', {
  body: { token: encryptedToken, action: 'decrypt' }
});

const plaintextToken = decryptResult.decrypted;
// Use token to call Plaid API
```

## Security Checklist

Before deploying:

- [ ] `BANK_TOKEN_ENCRYPTION_KEY` is set (32+ random characters)
- [ ] Key is stored in Supabase secrets (not in code)
- [ ] All bank connections use `createBankConnection()`
- [ ] No direct INSERT statements on `bank_connections`
- [ ] Decryption only happens in edge functions
- [ ] Audit logs are monitored regularly
- [ ] RLS policies are enabled on `bank_connections`
- [ ] Database backups are encrypted at rest

## Threat Model

### Threats Mitigated

1. **Database Breach**: Encrypted tokens are useless without encryption key
2. **Unauthorized Access**: RLS prevents cross-user access
3. **Insider Threats**: Audit logging tracks all operations
4. **SQL Injection**: Secure functions prevent malicious queries
5. **Token Theft**: Client-side encryption prevents network sniffing

### Remaining Risks

1. **Encryption Key Compromise**: If `BANK_TOKEN_ENCRYPTION_KEY` is exposed, all tokens can be decrypted
   - **Mitigation**: Store key in Supabase secrets, rotate regularly
   
2. **Edge Function Compromise**: Decryption happens in edge functions
   - **Mitigation**: Use JWT verification, audit all function calls
   
3. **Memory Exposure**: Plaintext tokens briefly exist in memory during encryption/decryption
   - **Mitigation**: Use secure coding practices, minimize token lifetime

## Key Rotation

To rotate the encryption key:

1. Generate new 32+ character key
2. Create edge function to re-encrypt all tokens
3. Update `BANK_TOKEN_ENCRYPTION_KEY` with new key
4. Run re-encryption function
5. Verify all tokens work with new key
6. Delete old key from all systems

## Compliance

This architecture addresses:

- **PCI DSS**: Encryption of sensitive data
- **GDPR**: User data protection, audit trails
- **SOC 2**: Access controls, logging
- **Open Banking**: Token security requirements

## Emergency Procedures

### If Encryption Key is Compromised

1. Immediately rotate encryption key
2. Force re-authentication for all users
3. Notify users of potential breach
4. Review audit logs for suspicious access
5. Contact Plaid to revoke all access tokens
6. Issue new tokens after security review

### If Database is Breached

1. Tokens are encrypted - limited exposure
2. Review audit logs for access patterns
3. Rotate encryption key immediately
4. Force re-authentication for all users
5. Consider revoking all Plaid tokens

## Contact

For security concerns: [Your Security Contact]
For Plaid support: https://plaid.com/contact-support/
