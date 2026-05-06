
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated, anon;

INSERT INTO public.user_roles (user_id, role)
VALUES ('6b4981a0-a436-4c0b-b2e7-ccb4ecc58f47', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
