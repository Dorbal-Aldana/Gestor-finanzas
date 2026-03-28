-- Cuotas mensuales en deudas + historial de abonos
alter table public.debts add column if not exists recurrence text not null default 'once';
alter table public.debts add column if not exists monthly_amount numeric(14,2);
alter table public.debts add column if not exists installments_planned int;
alter table public.debts add column if not exists installments_done int not null default 0;

create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  debt_id uuid not null references public.debts(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  payment_date date not null default (current_date),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists debt_payments_debt_id_idx on public.debt_payments(debt_id);
create index if not exists debt_payments_user_id_idx on public.debt_payments(user_id);

alter table public.debt_payments enable row level security;

drop policy if exists "debt_payments_crud_own" on public.debt_payments;
create policy "debt_payments_crud_own"
on public.debt_payments
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
