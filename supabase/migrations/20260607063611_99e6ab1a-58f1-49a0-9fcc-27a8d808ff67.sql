
-- habit_logs UPDATE policy
CREATE POLICY "Users can update their habit logs"
ON public.habit_logs FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.wellness_habits wh WHERE wh.id = habit_logs.habit_id AND wh.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.wellness_habits wh WHERE wh.id = habit_logs.habit_id AND wh.user_id = auth.uid()));

-- meditation_sessions UPDATE + DELETE
CREATE POLICY "Users can update their sessions"
ON public.meditation_sessions FOR UPDATE
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their sessions"
ON public.meditation_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Prevent self-admin escalation via trigger
CREATE OR REPLACE FUNCTION public.prevent_self_admin_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin'::public.app_role AND NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Users cannot assign the admin role to themselves';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_admin_insert ON public.user_roles;
CREATE TRIGGER prevent_self_admin_insert
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_admin_assignment();

-- Restrict EXECUTE on internal trigger functions (not called from API)
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
