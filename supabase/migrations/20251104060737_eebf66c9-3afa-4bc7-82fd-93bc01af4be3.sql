-- Fix function search path for security
CREATE OR REPLACE FUNCTION create_circle_goal_members()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a record for each member of the circle
  INSERT INTO circle_goal_members (goal_id, user_id, current_amount, completed)
  SELECT 
    NEW.id,
    cm.user_id,
    0,
    false
  FROM circle_members cm
  WHERE cm.circle_id = NEW.circle_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;