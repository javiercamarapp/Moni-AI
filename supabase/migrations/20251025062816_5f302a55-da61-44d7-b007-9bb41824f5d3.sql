-- ===============================================
-- CREAR NUEVAS TABLAS DE ACTIVOS Y PASIVOS
-- ===============================================

-- Tabla de activos con campos detallados
CREATE TABLE IF NOT EXISTS public.activos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  valor NUMERIC(15,2) DEFAULT 0,
  moneda TEXT DEFAULT 'MXN',
  liquidez_porcentaje NUMERIC(5,2) DEFAULT 100,
  tasa_rendimiento NUMERIC(5,2),
  fecha_adquisicion DATE,
  es_activo_fijo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pasivos con campos detallados
CREATE TABLE IF NOT EXISTS public.pasivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  valor NUMERIC(15,2) DEFAULT 0,
  moneda TEXT DEFAULT 'MXN',
  tasa_interes NUMERIC(5,2),
  fecha_inicio DATE,
  fecha_vencimiento DATE,
  es_corto_plazo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- HABILITAR ROW LEVEL SECURITY
-- ===============================================
ALTER TABLE public.activos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pasivos ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- POLÍTICAS RLS PARA ACTIVOS
-- ===============================================
CREATE POLICY "Users can view their own activos"
ON public.activos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activos"
ON public.activos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activos"
ON public.activos
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activos"
ON public.activos
FOR DELETE
USING (auth.uid() = user_id);

-- ===============================================
-- POLÍTICAS RLS PARA PASIVOS
-- ===============================================
CREATE POLICY "Users can view their own pasivos"
ON public.pasivos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pasivos"
ON public.pasivos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pasivos"
ON public.pasivos
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pasivos"
ON public.pasivos
FOR DELETE
USING (auth.uid() = user_id);

-- ===============================================
-- TRIGGERS PARA UPDATED_AT
-- ===============================================
CREATE TRIGGER update_activos_updated_at
BEFORE UPDATE ON public.activos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pasivos_updated_at
BEFORE UPDATE ON public.pasivos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ===============================================
-- TRIGGER PARA ACTUALIZAR NET WORTH
-- ===============================================
CREATE TRIGGER update_net_worth_on_activos_change
AFTER INSERT OR UPDATE OR DELETE ON public.activos
FOR EACH ROW
EXECUTE FUNCTION public.update_net_worth_snapshot();

CREATE TRIGGER update_net_worth_on_pasivos_change
AFTER INSERT OR UPDATE OR DELETE ON public.pasivos
FOR EACH ROW
EXECUTE FUNCTION public.update_net_worth_snapshot();

-- ===============================================
-- ÍNDICES PARA RENDIMIENTO
-- ===============================================
CREATE INDEX IF NOT EXISTS idx_activos_user_id ON public.activos(user_id);
CREATE INDEX IF NOT EXISTS idx_activos_categoria ON public.activos(categoria);
CREATE INDEX IF NOT EXISTS idx_activos_es_activo_fijo ON public.activos(es_activo_fijo);

CREATE INDEX IF NOT EXISTS idx_pasivos_user_id ON public.pasivos(user_id);
CREATE INDEX IF NOT EXISTS idx_pasivos_categoria ON public.pasivos(categoria);
CREATE INDEX IF NOT EXISTS idx_pasivos_es_corto_plazo ON public.pasivos(es_corto_plazo);

-- ===============================================
-- MIGRAR DATOS DE TABLAS ANTIGUAS
-- ===============================================
-- Migrar assets a activos
INSERT INTO public.activos (user_id, nombre, valor, categoria, es_activo_fijo, created_at, updated_at)
SELECT 
  user_id,
  name as nombre,
  value as valor,
  category as categoria,
  CASE 
    WHEN category IN ('Checking', 'Savings', 'Investments') THEN FALSE
    ELSE TRUE
  END as es_activo_fijo,
  created_at,
  updated_at
FROM public.assets
ON CONFLICT DO NOTHING;

-- Migrar liabilities a pasivos
INSERT INTO public.pasivos (user_id, nombre, valor, categoria, es_corto_plazo, created_at, updated_at)
SELECT 
  user_id,
  name as nombre,
  value as valor,
  category as categoria,
  CASE 
    WHEN category = 'Credit' THEN TRUE
    ELSE FALSE
  END as es_corto_plazo,
  created_at,
  updated_at
FROM public.liabilities
ON CONFLICT DO NOTHING;