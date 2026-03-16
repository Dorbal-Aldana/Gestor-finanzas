-- ============================================================
-- EJECUTA ESTO EN SUPABASE (SQL Editor) UNA SOLA VEZ
-- Sin esto solo se guarda autenticación y no perfiles/transacciones.
-- ============================================================

-- 1) Crear perfil para cada usuario que exista en Auth (obligatorio para guardar transacciones)
INSERT INTO public.profiles (id, full_name, base_currency)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
  'GTQ'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO UPDATE SET full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

-- 2) Suscripción free por usuario (evita errores en el trigger)
INSERT INTO public.subscriptions (user_id, provider, plan, status)
SELECT id, 'lemon_squeezy', 'free', 'inactive'
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- 3) Permitir transacciones sin cuenta (solo título, monto, tipo)
ALTER TABLE public.transactions
ALTER COLUMN account_id DROP NOT NULL;

-- 4) Política para que los usuarios puedan INSERTAR en su propio perfil (por si el trigger falla en el futuro)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());
