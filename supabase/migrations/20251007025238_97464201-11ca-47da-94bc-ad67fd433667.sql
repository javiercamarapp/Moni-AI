-- Fix database functions to add search_path for security
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$function$;

-- Add complete RLS policies for notification_history
CREATE POLICY "Service role can insert notification history"
ON public.notification_history
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Prevent user updates on notification history"
ON public.notification_history
FOR UPDATE
USING (false);

CREATE POLICY "Prevent user deletes on notification history"
ON public.notification_history
FOR DELETE
USING (false);

-- Add complete RLS policies for whatsapp_messages
CREATE POLICY "Service role can insert whatsapp messages"
ON public.whatsapp_messages
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update whatsapp messages"
ON public.whatsapp_messages
FOR UPDATE
USING (auth.role() = 'service_role');

CREATE POLICY "Prevent user deletes on whatsapp messages"
ON public.whatsapp_messages
FOR DELETE
USING (false);