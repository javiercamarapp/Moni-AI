-- Create a table for user aspirations
CREATE TABLE public.user_aspirations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id INTEGER NOT NULL,
  value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_aspirations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own aspirations" 
ON public.user_aspirations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own aspirations" 
ON public.user_aspirations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own aspirations" 
ON public.user_aspirations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own aspirations" 
ON public.user_aspirations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_aspirations_updated_at
BEFORE UPDATE ON public.user_aspirations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();