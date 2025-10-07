-- Create security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  metadata jsonb,
  ip_address text,
  user_agent text,
  status text NOT NULL DEFAULT 'success',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
ON public.security_audit_log
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Prevent user updates and deletes on audit logs
CREATE POLICY "Prevent user updates on audit logs"
ON public.security_audit_log
FOR UPDATE
USING (false);

CREATE POLICY "Prevent user deletes on audit logs"
ON public.security_audit_log
FOR DELETE
USING (false);

-- Create index for faster queries
CREATE INDEX idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX idx_security_audit_log_action ON public.security_audit_log(action);
CREATE INDEX idx_security_audit_log_timestamp ON public.security_audit_log(timestamp DESC);