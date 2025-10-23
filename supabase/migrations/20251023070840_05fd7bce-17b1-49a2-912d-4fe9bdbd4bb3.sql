-- Create custom_aspirations table for user-defined aspirations
CREATE TABLE IF NOT EXISTS public.custom_aspirations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_aspirations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own custom aspirations" 
ON public.custom_aspirations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom aspirations" 
ON public.custom_aspirations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom aspirations" 
ON public.custom_aspirations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom aspirations" 
ON public.custom_aspirations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_custom_aspirations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_aspirations_updated_at
BEFORE UPDATE ON public.custom_aspirations
FOR EACH ROW
EXECUTE FUNCTION public.update_custom_aspirations_updated_at();