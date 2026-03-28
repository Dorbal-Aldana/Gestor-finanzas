-- Finanzas personales SaaS (MVP) - Esquema inicial
-- Ejecuta este script en Supabase SQL Editor.

-- Extensiones útiles
create extension if not exists "pgcrypto";

-- Profile del usuario
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  base_currency text not null default 'GTQ',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Categorías (ingreso/gasto)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  color text,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories_crud_own"
on public.categories
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Subcategorías
create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.subcategories enable row level security;

create policy "subcategories_crud_own"
on public.subcategories
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Cuentas
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('bank','cash','credit_card','investment')),
  currency text not null default 'GTQ',
  initial_balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

create policy "accounts_crud_own"
on public.accounts
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Transacciones
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.subcategories(id) on delete set null,
  title text not null,
  amount numeric(14,2) not null check (amount >= 0),
  type text not null check (type in ('income','expense')),
  currency text not null default 'GTQ',
  exchange_rate numeric(18,6),
  amount_base numeric(14,2),
  tags text[] not null default '{}',
  datetime timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "transactions_crud_own"
on public.transactions
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Deudas
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  amount_total numeric(14,2) not null check (amount_total >= 0),
  amount_paid numeric(14,2) not null default 0 check (amount_paid >= 0),
  currency text not null default 'GTQ',
  due_date date not null,
  status text not null default 'pending' check (status in ('pending','paid','overdue','cancelled')),
  created_at timestamptz not null default now()
);

alter table public.debts enable row level security;

create policy "debts_crud_own"
on public.debts
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Suscripciones SaaS
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('lemon_squeezy','paddle')),
  provider_customer_id text,
  provider_subscription_id text,
  plan text not null default 'free',
  status text not null default 'inactive' check (status in ('trialing','active','past_due','canceled','inactive')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_user_id_unique on public.subscriptions(user_id);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own"
on public.subscriptions
for select
to authenticated
using (user_id = auth.uid());

-- Vista para UI: transacciones con nombres
create or replace view public.transactions_view as
select
  t.id,
  t.user_id,
  t.title,
  t.amount,
  t.type,
  t.currency,
  t.datetime,
  t.tags,
  t.account_id,
  a.name as account_name,
  t.category_id,
  c.name as category_name,
  t.subcategory_id,
  sc.name as subcategory_name
from public.transactions t
left join public.accounts a on a.id = t.account_id
left join public.categories c on c.id = t.category_id
left join public.subcategories sc on sc.id = t.subcategory_id;

-- RLS para la vista (depende de tablas base ya protegidas)

-- Trigger: crear profile automáticamente cuando se registra un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, provider, plan, status)
  values (new.id, 'lemon_squeezy', 'free', 'inactive')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

