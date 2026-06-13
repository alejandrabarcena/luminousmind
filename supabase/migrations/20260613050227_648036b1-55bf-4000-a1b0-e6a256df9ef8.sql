DROP POLICY IF EXISTS "Anyone can view meditations" ON public.meditations;
CREATE POLICY "View free or authenticated premium meditations"
ON public.meditations
FOR SELECT
USING (is_premium = false OR auth.uid() IS NOT NULL);
GRANT SELECT ON public.meditations TO anon, authenticated;