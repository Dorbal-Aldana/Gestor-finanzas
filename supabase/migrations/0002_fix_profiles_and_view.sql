-- Ejecuta en Supabase SQL Editor si los ingresos/egresos no se guardan o no se ven.
-- 1) Crear perfiles para usuarios que no tengan (por si el trigger no corrió)
INSERT INTO public.profiles (id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', '')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 2) Crear suscripción free para usuarios que no tengan
INSERT INTO public.subscriptions (user_id, provider, plan, status)
SELECT id, 'lemon_squeezy', 'free', 'inactive'
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- 3) Asegurar que account_id en transactions pueda ser NULL (por si no lo aplicaste)
ALTER TABLE public.transactions
ALTER COLUMN account_id DROP NOT NULL;
