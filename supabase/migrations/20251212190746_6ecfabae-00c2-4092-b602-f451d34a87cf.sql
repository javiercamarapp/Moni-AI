-- Create table for user financial journey paths
CREATE TABLE public.user_journey_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  journey_type TEXT NOT NULL CHECK (journey_type IN ('financial_life', 'first_million', 'first_property')),
  target_amount NUMERIC NULL,
  target_years INTEGER NULL,
  current_invested NUMERIC DEFAULT 0,
  monthly_investment_capacity NUMERIC DEFAULT 0,
  milestones JSONB DEFAULT '[]'::jsonb,
  ai_generated_plan JSONB NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_journey_paths ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own journey paths" 
ON public.user_journey_paths 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journey paths" 
ON public.user_journey_paths 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journey paths" 
ON public.user_journey_paths 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journey paths" 
ON public.user_journey_paths 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_journey_paths_updated_at
BEFORE UPDATE ON public.user_journey_paths
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();