import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { DebtsPageClient, type DebtRow, type PaymentRow } from "../../../components/debts-page-client";

export default async function DebtsPage({
  searchParams
}: {
  searchParams: Promise<{
    error?: string;
    msg?: string;
    tab?: string;
  }>;
}) {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const defaultTab = params.tab === "payments" ? "payments" : "accounts";
  const defaultPaymentDate = new Date().toISOString().slice(0, 10);

  const { data: debtsRaw } = await supabase
    .from("debts")
    .select(
      "id,title,description,amount_total,amount_paid,currency,due_date,status,recurrence,monthly_amount,installments_planned,installments_done,created_at"
    )
    .order("due_date", { ascending: true });

  const debts: DebtRow[] = (debtsRaw ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    amount_total: Number(d.amount_total),
    amount_paid: Number(d.amount_paid),
    currency: d.currency,
    due_date: d.due_date,
    status: d.status,
    recurrence: d.recurrence ?? "once",
    monthly_amount: d.monthly_amount != null ? Number(d.monthly_amount) : null,
    installments_planned: d.installments_planned,
    installments_done: d.installments_done ?? 0
  }));

  const { data: payRaw } = await supabase
    .from("debt_payments")
    .select("id, amount, payment_date, note, debts(title, currency)")
    .order("payment_date", { ascending: false })
    .limit(50);

  const payments: PaymentRow[] = (payRaw ?? []).map((row: Record<string, unknown>) => {
    const nested = row.debts as { title?: string; currency?: string } | null;
    return {
      id: String(row.id),
      amount: Number(row.amount),
      payment_date: String(row.payment_date),
      note: row.note != null ? String(row.note) : null,
      debt_title: nested?.title ?? "—",
      currency: nested?.currency ?? "GTQ"
    };
  });

  return (
    <>
      {params.error === "save" && (
        <div className="mx-auto max-w-4xl px-4 pt-8">
          <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
            <p className="font-medium">No se pudo guardar.</p>
            {params.msg ? (
              <p className="mt-1 break-all text-xs opacity-90">{decodeURIComponent(params.msg)}</p>
            ) : null}
          </div>
        </div>
      )}
      {params.error === "invalid" && (
        <div className="mx-auto max-w-4xl px-4 pt-8">
          <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            Título, monto total y fecha de vencimiento son obligatorios; el monto debe ser mayor a 0.
          </div>
        </div>
      )}
      {params.error === "invalid_monthly" && (
        <div className="mx-auto max-w-4xl px-4 pt-8">
          <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            En cuota mensual: concepto, cuota, cantidad de meses (≥ 1) y primer vencimiento son obligatorios.
          </div>
        </div>
      )}
      {params.error === "invalid_paid" && (
        <div className="mx-auto max-w-4xl px-4 pt-8">
          <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            El monto ya pagado debe estar entre 0 y el monto total.
          </div>
        </div>
      )}
      {params.error === "invalid_payment" && (
        <div className="mx-auto max-w-4xl px-4 pt-8">
          <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            Elige obligación, fecha y un monto mayor a 0.
          </div>
        </div>
      )}
      {params.error === "overpay" && (
        <div className="mx-auto max-w-4xl px-4 pt-8">
          <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            El abono no puede ser mayor que el saldo pendiente.
          </div>
        </div>
      )}
      {params.error === "plan_done" && (
        <div className="mx-auto max-w-4xl px-4 pt-8">
          <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            Este plan mensual ya completó todos los meses previstos.
          </div>
        </div>
      )}
      {params.error === "invalid_debt" && (
        <div className="mx-auto max-w-4xl px-4 pt-8">
          <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            No se encontró la obligación.
          </div>
        </div>
      )}

      <DebtsPageClient
        defaultTab={defaultTab}
        defaultPaymentDate={defaultPaymentDate}
        debts={debts}
        payments={payments}
      />
    </>
  );
}
