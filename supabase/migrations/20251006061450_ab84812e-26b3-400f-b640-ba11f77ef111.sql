-- Tabla para vincular números de WhatsApp con usuarios registrados
CREATE TABLE IF NOT EXISTS public.whatsapp_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_phone CHECK (phone_number ~ '^\+?[1-9]\d{1,14}$')
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_users ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own WhatsApp link"
ON public.whatsapp_users
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WhatsApp link"
ON public.whatsapp_users
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp link"
ON public.whatsapp_users
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_whatsapp_users_updated_at
BEFORE UPDATE ON public.whatsapp_users
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Tabla para registrar mensajes procesados
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  message_text TEXT NOT NULL,
  processed BOOLEAN DEFAULT false,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  ai_interpretation JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
ON public.whatsapp_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Índices para mejorar performance
CREATE INDEX idx_whatsapp_users_phone ON public.whatsapp_users(phone_number);
CREATE INDEX idx_whatsapp_users_user_id ON public.whatsapp_users(user_id);
CREATE INDEX idx_whatsapp_messages_user_id ON public.whatsapp_messages(user_id);
CREATE INDEX idx_whatsapp_messages_processed ON public.whatsapp_messages(processed);