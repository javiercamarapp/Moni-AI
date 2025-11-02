-- Enable realtime for monthly_rankings table
ALTER TABLE public.monthly_rankings REPLICA IDENTITY FULL;

-- Enable realtime for monthly_challenges table
ALTER TABLE public.monthly_challenges REPLICA IDENTITY FULL;