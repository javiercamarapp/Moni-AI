-- Tabla para desafíos entre amigos
CREATE TABLE IF NOT EXISTS public.friend_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenged_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  challenge_type TEXT NOT NULL DEFAULT 'savings', -- 'savings', 'expenses_reduction', 'goal_completion'
  category TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  challenger_progress NUMERIC NOT NULL DEFAULT 0,
  challenged_progress NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled', 'declined'
  winner_id UUID REFERENCES auth.users(id),
  xp_reward INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla para celebraciones de metas compartidas
CREATE TABLE IF NOT EXISTS public.goal_celebrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  celebration_type TEXT NOT NULL DEFAULT 'goal_completed', -- 'goal_completed', 'milestone_reached', 'challenge_won'
  message TEXT,
  viewers JSONB DEFAULT '[]'::jsonb, -- Array de user_ids que han visto la celebración
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_friend_challenges_challenger ON public.friend_challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_friend_challenges_challenged ON public.friend_challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_friend_challenges_status ON public.friend_challenges(status);
CREATE INDEX IF NOT EXISTS idx_goal_celebrations_user ON public.goal_celebrations(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_celebrations_goal ON public.goal_celebrations(goal_id);

-- Trigger para updated_at en friend_challenges
CREATE OR REPLACE FUNCTION update_friend_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_friend_challenges_updated_at
  BEFORE UPDATE ON public.friend_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_friend_challenges_updated_at();

-- RLS Policies para friend_challenges
ALTER TABLE public.friend_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own challenges"
  ON public.friend_challenges FOR SELECT
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE POLICY "Users can create challenges"
  ON public.friend_challenges FOR INSERT
  WITH CHECK (
    auth.uid() = challenger_id AND
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE (user_id = challenger_id AND friend_id = challenged_id AND status = 'accepted')
        OR (user_id = challenged_id AND friend_id = challenger_id AND status = 'accepted')
    )
  );

CREATE POLICY "Challenged user can update challenge status"
  ON public.friend_challenges FOR UPDATE
  USING (auth.uid() = challenged_id OR auth.uid() = challenger_id)
  WITH CHECK (auth.uid() = challenged_id OR auth.uid() = challenger_id);

CREATE POLICY "Users can delete their own challenges"
  ON public.friend_challenges FOR DELETE
  USING (auth.uid() = challenger_id);

-- RLS Policies para goal_celebrations
ALTER TABLE public.goal_celebrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view celebrations from friends"
  ON public.goal_celebrations FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE (user_id = auth.uid() AND friend_id = goal_celebrations.user_id AND status = 'accepted')
        OR (friend_id = auth.uid() AND user_id = goal_celebrations.user_id AND status = 'accepted')
    )
  );

CREATE POLICY "Users can create their own celebrations"
  ON public.goal_celebrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own celebrations"
  ON public.goal_celebrations FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (user_id = auth.uid() AND friend_id = goal_celebrations.user_id AND status = 'accepted')
      OR (friend_id = auth.uid() AND user_id = goal_celebrations.user_id AND status = 'accepted')
  ))
  WITH CHECK (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (user_id = auth.uid() AND friend_id = goal_celebrations.user_id AND status = 'accepted')
      OR (friend_id = auth.uid() AND user_id = goal_celebrations.user_id AND status = 'accepted')
  ));

-- Habilitar Realtime para friend_challenges y goal_celebrations
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_celebrations;