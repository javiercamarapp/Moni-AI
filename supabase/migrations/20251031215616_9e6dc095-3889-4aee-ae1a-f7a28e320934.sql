-- Allow users to update their own net worth snapshots
CREATE POLICY "Users can update their own snapshots"
ON public.net_worth_snapshots
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);