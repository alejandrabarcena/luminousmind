REVOKE EXECUTE ON FUNCTION public.prevent_self_admin_assignment() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_self_admin_assignment() TO service_role;