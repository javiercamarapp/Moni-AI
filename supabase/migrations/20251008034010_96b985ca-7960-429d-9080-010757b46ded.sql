-- Add DELETE policy for profiles table
-- This allows users to delete their own profile or implements soft-delete pattern

CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Add a trigger to ensure bank tokens are properly encrypted before insertion
-- This prevents accidental plaintext token storage
CREATE OR REPLACE FUNCTION public.validate_bank_token_encryption()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validate that token appears to be encrypted (base64, min 32 chars)
  IF length(NEW.access_token) < 32 OR NOT (NEW.access_token ~ '^[A-Za-z0-9+/=]+$') THEN
    RAISE EXCEPTION 'Bank access token must be encrypted using encrypt-bank-token function before storage';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_bank_token_encrypted
  BEFORE INSERT OR UPDATE ON public.bank_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_bank_token_encryption();