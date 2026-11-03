CREATE TABLE public.user_access (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 trial_ends_at timestamptz NOT NULL,
 manual_access boolean NOT NULL DEFAULT false,
 manual_plan text NOT NULL DEFAULT 'premium',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_access TO authenticated;
GRANT ALL ON public.user_access TO service_role;
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own access" ON public.user_access FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.initialize_user_access() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 INSERT INTO public.user_access(user_id, trial_ends_at) VALUES (NEW.id, now() + interval '7 days') ON CONFLICT (user_id) DO NOTHING;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.initialize_user_access() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER initialize_user_access AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.initialize_user_access();
CREATE TRIGGER user_access_updated_at BEFORE UPDATE ON public.user_access FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
INSERT INTO public.user_access(user_id, trial_ends_at)
 SELECT p.id, u.created_at + interval '7 days' FROM public.profiles p JOIN auth.users u ON u.id = p.id
 ON CONFLICT (user_id) DO NOTHING;