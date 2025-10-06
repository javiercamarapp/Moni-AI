-- Tabla para conexiones bancarias
CREATE TABLE IF NOT EXISTS public.bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bank_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  access_token TEXT NOT NULL, -- Encriptado
  plaid_item_id TEXT,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bank connections"
ON public.bank_connections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank connections"
ON public.bank_connections FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank connections"
ON public.bank_connections FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank connections"
ON public.bank_connections FOR DELETE USING (auth.uid() = user_id);

-- Tabla para configuración de notificaciones
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Notificaciones automáticas
  daily_summary BOOLEAN DEFAULT true,
  weekly_analysis BOOLEAN DEFAULT true,
  spending_alerts BOOLEAN DEFAULT true,
  savings_tips BOOLEAN DEFAULT true,
  goal_reminders BOOLEAN DEFAULT true,
  
  -- Umbrales de alerta
  daily_spending_limit NUMERIC DEFAULT 1000,
  transaction_alert_threshold NUMERIC DEFAULT 500,
  
  -- Horarios preferidos (formato HH:MM)
  preferred_notification_time TIME DEFAULT '09:00',
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification settings"
ON public.notification_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
ON public.notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
ON public.notification_settings FOR UPDATE USING (auth.uid() = user_id);

-- Tabla para historial de notificaciones enviadas
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'sent', -- sent, failed, read
  metadata JSONB
);

ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification history"
ON public.notification_history FOR SELECT USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_bank_connections_updated_at
BEFORE UPDATE ON public.bank_connections
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Índices
CREATE INDEX idx_bank_connections_user_id ON public.bank_connections(user_id);
CREATE INDEX idx_bank_connections_active ON public.bank_connections(is_active);
CREATE INDEX idx_notification_history_user_id ON public.notification_history(user_id);
CREATE INDEX idx_notification_history_sent_at ON public.notification_history(sent_at);
CREATE INDEX idx_notification_history_type ON public.notification_history(notification_type);