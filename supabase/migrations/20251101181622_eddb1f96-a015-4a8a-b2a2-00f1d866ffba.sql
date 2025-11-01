-- Habilitar realtime para la tabla transactions
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- Publicar cambios en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;