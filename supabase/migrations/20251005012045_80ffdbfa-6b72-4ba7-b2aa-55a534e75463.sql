-- Crear tabla de categorías
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ingreso', 'gasto')),
  color TEXT NOT NULL DEFAULT 'bg-primary/20',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de transacciones
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  payment_method TEXT,
  account TEXT,
  frequency TEXT,
  transaction_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ingreso', 'gasto')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Políticas para categories
CREATE POLICY "Users can view their own categories"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- Habilitar RLS en transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at en categories
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para actualizar updated_at en transactions
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insertar categorías predeterminadas para ingresos
INSERT INTO public.categories (user_id, name, type, color) 
SELECT id, 'Salario', 'ingreso', 'bg-primary/20' FROM auth.users
UNION ALL
SELECT id, 'Freelance', 'ingreso', 'bg-secondary/20' FROM auth.users
UNION ALL
SELECT id, 'Negocio', 'ingreso', 'bg-accent/20' FROM auth.users;

-- Insertar categorías predeterminadas para gastos
INSERT INTO public.categories (user_id, name, type, color)
SELECT id, 'Vivienda', 'gasto', 'bg-red-500/20' FROM auth.users
UNION ALL
SELECT id, 'Alimentación', 'gasto', 'bg-orange-500/20' FROM auth.users
UNION ALL
SELECT id, 'Transporte', 'gasto', 'bg-yellow-500/20' FROM auth.users
UNION ALL
SELECT id, 'Servicios', 'gasto', 'bg-blue-500/20' FROM auth.users;

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_categories_type ON public.categories(type);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);