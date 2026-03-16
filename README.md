# Gestor de Finanzas Personales

Aplicación web para gestión de finanzas personales tipo SaaS construida con Next.js 14, Supabase, Gemini, Lemon Squeezy/Paddle, PostHog y Tailwind UI.

## Setup (MVP funcionando con BD + Auth + SaaS base)

### 1) Base de datos (Supabase)

- Ejecuta el SQL inicial en tu proyecto de Supabase:
  - `supabase/migrations/0001_init.sql`

Esto crea:
- Tablas: `profiles`, `accounts`, `categories`, `subcategories`, `transactions`, `debts`, `subscriptions`
- RLS (Row Level Security) por usuario
- Vista: `transactions_view`
- Trigger para crear `profiles`/`subscriptions` al registrar usuario

### 2) Variables de entorno

Crea `.env.local` en la raíz:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

GEMINI_API_KEY=...

NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

LEMON_SQUEEZY_WEBHOOK_SECRET=...
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
- Para registrar transacciones necesitas crear al menos 1 `account` y (opcional) `category` en Supabase
- Dashboard: `/dashboard`
- Crear transacción: `/dashboard/transactions/new`
- Facturación (base SaaS): `/dashboard/billing`

## Scripts

- `npm run dev` - entorno de desarrollo
- `npm run build` - build de producción
- `npm start` - servidor de producción
- `npm run lint` - linting
- `npm run seed` - crea 2 usuarios de prueba con datos completos

