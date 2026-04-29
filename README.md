# Gestor de Finanzas Personales

Aplicación web para gestión de finanzas personales tipo SaaS construida con Next.js 14, Supabase, Mistral AI, Lemon Squeezy/Paddle, PostHog y Tailwind UI.

## Setup (MVP funcionando con BD + Auth + SaaS base)

### 1) Base de datos (Supabase)

En Supabase ve a **SQL Editor** → **New query** → pega el contenido de **`supabase/CREAR_TODO_EN_SUPABASE.sql`** → **Run**.

Ese script crea todas las tablas (profiles, accounts, categories, transactions, etc.), políticas RLS, la vista, el trigger para nuevos usuarios y rellena perfiles/suscripciones para los usuarios que ya tengas en Auth. Después de ejecutarlo verás las tablas en **Table Editor** y podrás guardar ingresos y gastos desde la app.

### 2) Variables de entorno

Crea `.env.local` en la raíz:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

MISTRAL_API_KEY=...

NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

LEMON_SQUEEZY_WEBHOOK_SECRET=...
LEMON_SQUEEZY_API_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3) Instalar y correr

- `npm install`
- `npm run dev`

### 4) (Opcional) Crear 2 usuarios de prueba

- `npm run seed` — Crea dos usuarios con perfil, cuentas, categorías y transacciones de ejemplo.
- Credenciales:
  - **demo1@gestor-finanzas.local** / **Demo123456!**
  - **demo2@gestor-finanzas.local** / **Demo123456!**
- Requiere `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`.

### 5) Flujo

- Crear cuenta en `/sign-up`
- Iniciar sesión en `/sign-in`
- Dashboard: `/dashboard`
- Nuevo ingreso o gasto: `/dashboard/transactions/new` (solo título, monto, tipo y moneda)
- Facturación (base SaaS): `/dashboard/billing`

## Scripts

- `npm run dev` - entorno de desarrollo
- `npm run build` - build de producción
- `npm start` - servidor de producción
- `npm run lint` - linting
- `npm run seed` - crea 2 usuarios de prueba con datos completos

