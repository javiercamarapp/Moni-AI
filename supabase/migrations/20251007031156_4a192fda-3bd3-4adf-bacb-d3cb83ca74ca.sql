-- Create a secure function to insert bank connections with encryption validation
CREATE OR REPLACE FUNCTION public.insert_bank_connection_secure(
  p_user_id uuid,
  p_bank_name text,
  p_account_id text,
  p_encrypted_token text,
  p_plaid_item_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_connection_id uuid;
BEGIN
  -- Validate that token appears to be encrypted (base64, min 32 chars)
  IF length(p_encrypted_token) < 32 OR NOT (p_encrypted_token ~ '^[A-Za-z0-9+/=]+$') THEN
    RAISE EXCEPTION 'Token must be pre-encrypted using encrypt-bank-token function. Token format invalid.';
  END IF;
  
  -- Verify user is authenticated
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: User must be authenticated';
  END IF;
  
  -- Insert the connection
  INSERT INTO public.bank_connections (
    user_id,
    bank_name,
    account_id,
    access_token,
    plaid_item_id
  ) VALUES (
    p_user_id,
    p_bank_name,
    p_account_id,
    p_encrypted_token,
    p_plaid_item_id
  )
  RETURNING id INTO v_connection_id;
  
  -- Log to audit trail
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    timestamp,
    metadata,
    status
  ) VALUES (
    p_user_id,
    'bank_connection_created',
    now(),
    jsonb_build_object(
      'connection_id', v_connection_id,
      'bank_name', p_bank_name,
      'account_id', p_account_id
    ),
    'success'
  );
  
  RETURN v_connection_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_bank_connection_secure TO authenticated;

-- Add comment to the function
COMMENT ON FUNCTION public.insert_bank_connection_secure IS 'Securely inserts bank connection with encryption validation. Token MUST be pre-encrypted using client-side encrypt-bank-token edge function before calling this function.';

-- Create trigger to audit bank connection modifications
CREATE OR REPLACE FUNCTION public.audit_bank_connection_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when bank connections are modified
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    timestamp,
    metadata,
    status
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'bank_connection_inserted'
      WHEN TG_OP = 'UPDATE' THEN 'bank_connection_updated'
      WHEN TG_OP = 'DELETE' THEN 'bank_connection_deleted'
    END,
    now(),
    jsonb_build_object(
      'operation', TG_OP,
      'connection_id', COALESCE(NEW.id, OLD.id),
      'bank_name', COALESCE(NEW.bank_name, OLD.bank_name)
    ),
    'success'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS audit_bank_modifications ON public.bank_connections;

-- Create the trigger
CREATE TRIGGER audit_bank_modifications
AFTER INSERT OR UPDATE OR DELETE ON public.bank_connections
FOR EACH ROW
EXECUTE FUNCTION public.audit_bank_connection_changes();