-- Function to create circle_goal_members entries for all circle members when a new goal is created
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create member progress records
DROP TRIGGER IF EXISTS trigger_create_circle_goal_members ON circle_goals;
CREATE TRIGGER trigger_create_circle_goal_members
  AFTER INSERT ON circle_goals
  FOR EACH ROW
  EXECUTE FUNCTION create_circle_goal_members();

-- Insert missing records for existing goals
INSERT INTO circle_goal_members (goal_id, user_id, current_amount, completed)
SELECT 
  cg.id,
  cm.user_id,
  0,
  false
FROM circle_goals cg
CROSS JOIN circle_members cm
WHERE cm.circle_id = cg.circle_id
  AND NOT EXISTS (
    SELECT 1 FROM circle_goal_members cgm 
    WHERE cgm.goal_id = cg.id AND cgm.user_id = cm.user_id
  );