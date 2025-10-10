-- Attach validation trigger to bank_connections table
-- This ensures all tokens are encrypted before storage
CREATE TRIGGER validate_bank_token_encryption_trigger
  BEFORE INSERT OR UPDATE ON public.bank_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_bank_token_encryption();

-- Attach audit trigger to bank_connections table
-- This logs all changes for security monitoring
CREATE TRIGGER audit_bank_connection_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.bank_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_bank_connection_changes();

-- Add comment for documentation
COMMENT ON TRIGGER validate_bank_token_encryption_trigger ON public.bank_connections IS 
  'Security: Validates that bank access tokens are encrypted before storage using AES-256-GCM';

COMMENT ON TRIGGER audit_bank_connection_changes_trigger ON public.bank_connections IS 
  'Security: Logs all bank connection changes to security_audit_log for monitoring';