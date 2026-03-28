"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createDebt, recordDebtPayment } from "../app/dashboard/debts/actions";
import { nextDueDate } from "../lib/debt-status";

export type DebtRow = {
  id: string;
  title: string;
  description: string | null;
  amount_total: number;
  amount_paid: number;
  currency: string | null;
  due_date: string;
  status: string;
  recurrence: string | null;
  monthly_amount: number | null;
  installments_planned: number | null;
  installments_done: number | null;
};

export type PaymentRow = {
  id: string;
  amount: number;
  payment_date: string;
  note: string | null;
  debt_title: string;
  currency: string | null;
};

function statusLabel(s: string): string {
  switch (s) {
    case "pending":
      return "Pendiente";
    case "paid":
      return "Pagada";
    case "overdue":
      return "Vencida";
    case "cancelled":
      return "Cancelada";
    default:
      return s;
  }
}

export function DebtsPageClient({
  defaultTab,
  defaultPaymentDate,
  debts,
  payments
}: {
  defaultTab: "accounts" | "payments";
  defaultPaymentDate: string;
  debts: DebtRow[];
  payments: PaymentRow[];
}) {
  const [tab, setTab] = useState<"accounts" | "payments">(defaultTab);
  const [recurrence, setRecurrence] = useState<"once" | "monthly">("once");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [monthsPlanned, setMonthsPlanned] = useState("12");

  const monthlyPreview = useMemo(() => {
    const m = Number(monthlyAmount);
    const n = Math.floor(Number(monthsPlanned));
    if (!Number.isFinite(m) || m <= 0 || !Number.isFinite(n) || n < 1) return null;
    return Math.round(m * n * 100) / 100;
  }, [monthlyAmount, monthsPlanned]);

  const debtsWithBalance = useMemo(
    () =>
      debts.filter((d) => {
        const bal = Math.max(0, Number(d.amount_total) - Number(d.amount_paid));
        return bal > 0.009;
      }),
    [debts]
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-8">
      <div>
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al dashboard
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Cuentas por pagar</h1>
        <p className="text-sm text-slate-400">
          Obligaciones puntuales o en cuotas mensuales. Registra abonos en la pestaña correspondiente.
        </p>
      </div>

      <div className="inline-flex rounded-full border border-slate-800 bg-slate-950/70 p-1 text-xs">
        <button
          type="button"
          onClick={() => setTab("accounts")}
          className={`rounded-full px-3 py-1.5 ${
            tab === "accounts" ? "bg-slate-800 text-slate-50" : "text-slate-400"
          }`}
        >
          Cuentas y cuotas
        </button>
        <button
          type="button"
          onClick={() => setTab("payments")}
          className={`rounded-full px-3 py-1.5 ${
            tab === "payments" ? "bg-slate-800 text-slate-50" : "text-slate-400"
          }`}
        >
          Abonos mensuales
        </button>
      </div>

      {tab === "accounts" ? (
        <section className="grid gap-4 md:grid-cols-[1.2fr,1.8fr]">
          <form
            action={createDebt}
            className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5 text-sm"
          >
            <h2 className="text-sm font-semibold text-slate-200">Nueva cuenta por pagar</h2>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
              <p className="text-[11px] font-medium text-slate-300">Tipo de obligación</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <label className="flex cursor-pointer items-center gap-2 text-slate-300">
                  <input
                    type="radio"
                    name="recurrence"
                    value="once"
                    checked={recurrence === "once"}
                    onChange={() => setRecurrence("once")}
                    className="accent-primary"
                  />
                  Pago único
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-slate-300">
                  <input
                    type="radio"
                    name="recurrence"
                    value="monthly"
                    checked={recurrence === "monthly"}
                    onChange={() => setRecurrence("monthly")}
                    className="accent-primary"
                  />
                  Cuota mensual (varios meses)
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300">Concepto / acreedor</label>
              <input
                name="title"
                required
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
                placeholder="Ej. Préstamo banco, renta local…"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300">Notas (opcional)</label>
              <textarea
                name="description"
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600 placeholder:text-slate-600"
                placeholder="Referencia, número de contrato…"
              />
            </div>

            {recurrence === "once" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-300">Monto total a pagar</label>
                  <input
                    name="amount_total"
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300">Ya pagado (opcional)</label>
                  <input
                    name="amount_paid"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={0}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
                    placeholder="0.00"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-amber-900/40 bg-amber-950/20 p-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-slate-300">Cuota mensual</label>
                    <input
                      name="monthly_amount"
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={monthlyAmount}
                      onChange={(e) => setMonthlyAmount(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300">Duración (meses)</label>
                    <input
                      name="installments_planned"
                      required
                      type="number"
                      min={1}
                      max={600}
                      value={monthsPlanned}
                      onChange={(e) => setMonthsPlanned(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
                    />
                  </div>
                </div>
                {monthlyPreview != null ? (
                  <p className="text-[11px] text-amber-200/90">
                    Compromiso total estimado: <strong>{monthlyPreview.toLocaleString("es-GT")}</strong> (cuota × meses).
                  </p>
                ) : null}
                <div>
                  <label className="text-xs text-slate-300">Ya abonado antes de registrar aquí (opcional)</label>
                  <input
                    name="amount_paid"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={0}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-slate-300">Moneda</label>
                <select
                  name="currency"
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm"
                >
                  <option value="GTQ">GTQ</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-300">
                  {recurrence === "monthly" ? "Primer vencimiento" : "Fecha de vencimiento"}
                </label>
                <input
                  name="due_date"
                  required
                  type="date"
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-500"
            >
              Guardar
            </button>
          </form>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5 text-xs">
            <h2 className="mb-3 text-sm font-semibold text-slate-200">Tus obligaciones</h2>
            {debts.length === 0 ? (
              <p className="text-slate-400">Aún no hay registros.</p>
            ) : (
              <div className="space-y-2">
                {debts.map((d) => {
                  const total = Number(d.amount_total);
                  const paid = Number(d.amount_paid);
                  const balance = Math.max(0, total - paid);
                  const rec = d.recurrence === "monthly" ? "monthly" : "once";
                  const nextStr = nextDueDate({
                    recurrence: rec,
                    due_date: d.due_date,
                    installments_done: d.installments_done ?? 0
                  });
                  const nextLabel = new Date(nextStr + "T12:00:00").toLocaleDateString("es-GT", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  });
                  const planned = d.installments_planned;
                  const done = d.installments_done ?? 0;
                  return (
                    <div
                      key={d.id}
                      className="flex flex-col gap-1 rounded-xl border border-slate-800/70 bg-slate-950/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-50">{d.title}</p>
                        <p className="text-[11px] text-slate-400">
                          {rec === "monthly" ? (
                            <>
                              Cuota {d.monthly_amount != null ? `${Number(d.monthly_amount).toLocaleString("es-GT")} ` : ""}
                              · {planned != null ? `${done}/${planned} meses` : "mensual"}
                              {" · "}
                            </>
                          ) : null}
                          Próx. venc. {nextLabel} · {statusLabel(d.status)}
                        </p>
                        {d.description ? (
                          <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{d.description}</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-slate-400">
                          {d.currency ?? "GTQ"} {paid.toLocaleString("es-GT")} / {total.toLocaleString("es-GT")}
                        </p>
                        <p className="text-sm font-semibold text-amber-200/90">
                          Pendiente: {d.currency ?? "GTQ"} {balance.toLocaleString("es-GT")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-[1.1fr,1.4fr]">
          <form
            action={recordDebtPayment}
            className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5 text-sm"
          >
            <h2 className="text-sm font-semibold text-slate-200">Registrar abono</h2>
            <p className="text-[11px] text-slate-400">
              Cada registro descuenta del saldo. En planes mensuales cuenta como un mes pagado.
            </p>

            <div>
              <label className="text-xs text-slate-300">Cuenta por pagar</label>
              <select
                name="debt_id"
                required
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
                defaultValue=""
              >
                <option value="" disabled>
                  Elige una obligación con saldo
                </option>
                {debtsWithBalance.map((d) => {
                  const bal = Math.max(0, Number(d.amount_total) - Number(d.amount_paid));
                  const sug =
                    d.recurrence === "monthly" && d.monthly_amount != null
                      ? Number(d.monthly_amount)
                      : bal;
                  return (
                    <option key={d.id} value={d.id} data-suggest={sug}>
                      {d.title} — pendiente {d.currency ?? "GTQ"} {bal.toLocaleString("es-GT")}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-slate-300">Monto del abono</label>
                <input
                  name="amount"
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300">Fecha del abono</label>
                <input
                  name="payment_date"
                  required
                  type="date"
                  defaultValue={defaultPaymentDate}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300">Nota (opcional)</label>
              <input
                name="note"
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
                placeholder="Ej. Transferencia, efectivo…"
              />
            </div>

            <button
              type="submit"
              disabled={debtsWithBalance.length === 0}
              className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-500 disabled:opacity-50"
            >
              Aplicar abono
            </button>
          </form>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5 text-xs">
            <h2 className="mb-3 text-sm font-semibold text-slate-200">Últimos abonos</h2>
            {payments.length === 0 ? (
              <p className="text-slate-400">Aún no hay abonos registrados.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => {
                  const dt = new Date(p.payment_date + "T12:00:00").toLocaleDateString("es-GT", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  });
                  return (
                    <div
                      key={p.id}
                      className="rounded-xl border border-slate-800/70 bg-slate-950/70 px-3 py-2"
                    >
                      <div className="flex justify-between gap-2">
                        <p className="font-medium text-slate-100">{p.debt_title}</p>
                        <p className="font-semibold text-emerald-300/90">
                          {p.currency ?? "GTQ"} {Number(p.amount).toLocaleString("es-GT")}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400">{dt}</p>
                      {p.note ? <p className="mt-1 text-[11px] text-slate-500">{p.note}</p> : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
