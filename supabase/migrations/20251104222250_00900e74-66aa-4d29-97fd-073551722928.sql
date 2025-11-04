-- 📘 Tabla: Ajustes automáticos de metas individuales
CREATE TABLE IF NOT EXISTS goal_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  old_weekly_amount NUMERIC(12,2),
  new_weekly_amount NUMERIC(12,2),
  old_predicted_date DATE,
  new_predicted_date DATE,
  reason TEXT,
  adjustment_type TEXT DEFAULT 'automatic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📘 Tabla: Ajustes automáticos de metas grupales
CREATE TABLE IF NOT EXISTS goal_group_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES circle_goals(id) ON DELETE CASCADE,
  user_id UUID,
  old_weekly_amount NUMERIC(12,2),
  new_weekly_amount NUMERIC(12,2),
  old_predicted_date DATE,
  new_predicted_date DATE,
  reason TEXT,
  members_affected INTEGER DEFAULT 0,
  adjustment_type TEXT DEFAULT 'automatic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE goal_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_group_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goal_adjustments
CREATE POLICY "Users can view their own adjustments"
  ON goal_adjustments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert adjustments"
  ON goal_adjustments FOR INSERT
  WITH CHECK (true);

-- RLS Policies for goal_group_adjustments
CREATE POLICY "Circle members can view group adjustments"
  ON goal_group_adjustments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM circle_goals cg
      JOIN circle_members cm ON cm.circle_id = cg.circle_id
      WHERE cg.id = goal_group_adjustments.goal_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert group adjustments"
  ON goal_group_adjustments FOR INSERT
  WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_goal_adjustments_goal_id ON goal_adjustments(goal_id);
CREATE INDEX idx_goal_adjustments_user_id ON goal_adjustments(user_id);
CREATE INDEX idx_goal_adjustments_created_at ON goal_adjustments(created_at DESC);

CREATE INDEX idx_goal_group_adjustments_goal_id ON goal_group_adjustments(goal_id);
CREATE INDEX idx_goal_group_adjustments_created_at ON goal_group_adjustments(created_at DESC);