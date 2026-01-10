-- Drop the restrictive policies that prevent users from managing their notifications
DROP POLICY IF EXISTS "Prevent user deletes on notification history" ON public.notification_history;
DROP POLICY IF EXISTS "Prevent user updates on notification history" ON public.notification_history;

-- Create new policies that allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notification_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create new policies that allow users to update their own notifications (for marking as read)
CREATE POLICY "Users can update their own notifications"
ON public.notification_history
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);