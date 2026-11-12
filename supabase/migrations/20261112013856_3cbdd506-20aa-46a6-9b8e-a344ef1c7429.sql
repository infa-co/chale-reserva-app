CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
 AND (_user_id = auth.uid() OR auth.role() = 'service_role');
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid,public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid,public.app_role) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid,_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT private.has_role(_user_id,_role);
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated,service_role;
REVOKE EXECUTE ON FUNCTION public.assign_admin_role(uuid) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_assign_admin_to_first_user() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.log_sensitive_data_access() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_personal_data() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.initialize_user_access() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.assign_admin_role(uuid),public.cleanup_old_rate_limits(),public.auto_assign_admin_to_first_user(),public.handle_new_user(),public.log_sensitive_data_access(),public.validate_personal_data(),public.initialize_user_access() TO service_role;
DROP POLICY "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Users can read their own avatar objects" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);