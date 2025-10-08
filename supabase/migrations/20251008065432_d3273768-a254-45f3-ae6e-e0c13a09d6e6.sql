-- Create assets table to store user's assets
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Create policies for assets
CREATE POLICY "Users can view their own assets"
ON public.assets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets"
ON public.assets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets"
ON public.assets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets"
ON public.assets FOR DELETE
USING (auth.uid() = user_id);

-- Create liabilities table to store user's liabilities
CREATE TABLE public.liabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on liabilities
ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;

-- Create policies for liabilities
CREATE POLICY "Users can view their own liabilities"
ON public.liabilities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own liabilities"
ON public.liabilities FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own liabilities"
ON public.liabilities FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own liabilities"
ON public.liabilities FOR DELETE
USING (auth.uid() = user_id);

-- Create net_worth_snapshots table to store historical net worth data
CREATE TABLE public.net_worth_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  total_assets NUMERIC NOT NULL DEFAULT 0,
  total_liabilities NUMERIC NOT NULL DEFAULT 0,
  net_worth NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on net_worth_snapshots
ALTER TABLE public.net_worth_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies for net_worth_snapshots
CREATE POLICY "Users can view their own snapshots"
ON public.net_worth_snapshots FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snapshots"
ON public.net_worth_snapshots FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_net_worth_snapshots_user_date ON public.net_worth_snapshots(user_id, snapshot_date DESC);
CREATE INDEX idx_assets_user_id ON public.assets(user_id);
CREATE INDEX idx_liabilities_user_id ON public.liabilities(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_net_worth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.update_net_worth_updated_at();

CREATE TRIGGER update_liabilities_updated_at
BEFORE UPDATE ON public.liabilities
FOR EACH ROW
EXECUTE FUNCTION public.update_net_worth_updated_at();