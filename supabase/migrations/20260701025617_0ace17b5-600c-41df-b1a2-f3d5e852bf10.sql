ALTER POLICY "Admins can view all roles" ON public.user_roles TO authenticated;
ALTER POLICY "Admins can insert roles" ON public.user_roles TO authenticated;
ALTER POLICY "Admins can update roles" ON public.user_roles TO authenticated;
ALTER POLICY "Admins can delete roles" ON public.user_roles TO authenticated;
ALTER POLICY "Users can view their own profile" ON public.profiles TO authenticated;
ALTER POLICY "Users can insert their own profile" ON public.profiles TO authenticated;
ALTER POLICY "Users can update their own profile" ON public.profiles TO authenticated;
ALTER POLICY "Admins can view all profiles" ON public.profiles TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;