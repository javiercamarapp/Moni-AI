-- Fix security warnings - set search_path for functions
DROP FUNCTION IF EXISTS public.update_circle_goal_members_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_circle_goal_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER update_circle_goal_members_updated_at
  BEFORE UPDATE ON public.circle_goal_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_circle_goal_members_updated_at();