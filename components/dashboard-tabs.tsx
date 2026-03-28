"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { BrainCircuit, CreditCard, FileDown, Send } from "lucide-react";
import { IncomeExpenseChart, type ChartPoint } from "./income-expense-chart";

type ChatMessage = { role: "user" | "assistant"; content: string };

type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  currency: string | null;
  datetime: string | null;
  category_name: string | null;
  notes?: string | null;
};

type SummaryProps = {
  monthLabel: string;
  income: number;
  expenses: number;
};

type DebtsSummaryProps = {
  count: number;
  pendingTotal: number;
};

export function DashboardTabs({
  summary,
  transactions,
  chartData = [],
  categoriesForFilter = [],
  debtsSummary = { count: 0, pendingTotal: 0 },
  proUnlocked = false
}: {
  summary: SummaryProps;
  transactions: Transaction[];
  chartData?: ChartPoint[];
  categoriesForFilter?: string[];
  debtsSummary?: DebtsSummaryProps;
  proUnlocked?: boolean;
}) {
  const [tab, setTab] = useState<"overview" | "movements" | "report">("overview");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [reportKind, setReportKind] = useState<"date" | "category">("date");
  const [repLoading, setRepLoading] = useState(false);
  const [repFrom, setRepFrom] = useState(() => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  });
  const [repTo, setRepTo] = useState(() => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const d = String(t.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [repCategory, setRepCategory] = useState("");
  const [reportContent, setReportContent] = useState<"transactions" | "debts" | "both">("both");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (!repCategory && categoriesForFilter.length > 0) {
      setRepCategory(categoriesForFilter[0]);
    }
  }, [categoriesForFilter, repCategory]);

  const net = summary.income - summary.expenses;
  const isNegative = net < 0;

  const downloadCustomReport = useCallback(async () => {
    if (!proUnlocked) {
      alert("Los PDF son del plan Pro. Abre «Plan Pro» en la barra superior para suscribirte.");
      return;
    }
    if (repFrom > repTo) {
      alert("La fecha «desde» no puede ser posterior a «hasta».");
      return;
    }
    const needsCategory = reportKind === "category" && reportContent !== "debts";
    if (needsCategory && !repCategory) {
      alert("Elige una categoría.");
      return;
    }

    const q = new URLSearchParams();
    q.set("mode", reportKind === "date" ? "date" : "category");
    q.set("from", repFrom);
    q.set("to", repTo);
    q.set("content", reportContent);
    if (reportKind === "category" && needsCategory) q.set("category", repCategory);

    setRepLoading(true);
    try {
      const res = await fetch(`/api/report?${q.toString()}`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al generar el reporte");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";]+)"?/);
      const name = match?.[1] ?? "reporte-finanzas.pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo descargar el reporte.");
    } finally {
      setRepLoading(false);
    }
  }, [proUnlocked, repCategory, repFrom, repTo, reportKind, reportContent]);

  const handleSendChat = async () => {
    if (!proUnlocked) {
      alert("El chat con IA es del plan Pro. Ve a Plan Pro en la barra superior.");
      return;
    }
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: chatMessages,
        }),
      });
      const json = await res.json();
      if (res.status === 403 && json.error === "pro_required") {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              json.reply ||
              "Necesitas el plan Pro. Abre Plan y facturación desde el enlace «Plan Pro» arriba."
          }
        ]);
        return;
      }
      const reply = json.reply ?? "No se pudo obtener respuesta.";
      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error de conexión. Revisa tu red e intenta de nuevo." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="inline-flex rounded-full border border-slate-800 bg-slate-950/70 p-1 text-xs">
        <button
          onClick={() => setTab("overview")}
          className={`rounded-full px-3 py-1 ${
            tab === "overview" ? "bg-slate-800 text-slate-50" : "text-slate-400"
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setTab("movements")}
          className={`rounded-full px-3 py-1 ${
            tab === "movements" ? "bg-slate-800 text-slate-50" : "text-slate-400"
          }`}
        >
          Movimientos
        </button>
        <button
          onClick={() => setTab("report")}
          className={`rounded-full px-3 py-1 ${
            tab === "report" ? "bg-slate-800 text-slate-50" : "text-slate-400"
          }`}
        >
          Reporte
        </button>
      </div>

      {tab === "report" ? (
        <section className="mt-4 space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Exportar reporte (PDF)</h2>
            <p className="mt-1 text-[11px] text-slate-400">
              Descarga un PDF con movimientos, cuentas por pagar (vencimiento en el rango) o ambos. Incluye tablas
              resumidas; las descripciones se recortan si son muy largas.
            </p>
          </div>

          <div className="inline-flex flex-wrap gap-1 rounded-full border border-slate-800 bg-slate-950/70 p-1 text-xs">
            <button
              type="button"
              onClick={() => setReportContent("transactions")}
              className={`rounded-full px-3 py-1 ${
                reportContent === "transactions" ? "bg-slate-800 text-slate-50" : "text-slate-400"
              }`}
            >
              Solo movimientos
            </button>
            <button
              type="button"
              onClick={() => setReportContent("debts")}
              className={`rounded-full px-3 py-1 ${
                reportContent === "debts" ? "bg-slate-800 text-slate-50" : "text-slate-400"
              }`}
            >
              Solo cuentas por pagar
            </button>
            <button
              type="button"
              onClick={() => setReportContent("both")}
              className={`rounded-full px-3 py-1 ${
                reportContent === "both" ? "bg-slate-800 text-slate-50" : "text-slate-400"
              }`}
            >
              Movimientos + cuentas por pagar
            </button>
          </div>

          <div className="inline-flex rounded-full border border-slate-800 bg-slate-950/70 p-1 text-xs">
            <button
              type="button"
              onClick={() => setReportKind("date")}
              className={`rounded-full px-3 py-1 ${
                reportKind === "date" ? "bg-slate-800 text-slate-50" : "text-slate-400"
              }`}
            >
              Por fecha
            </button>
            <button
              type="button"
              onClick={() => setReportKind("category")}
              className={`rounded-full px-3 py-1 ${
                reportKind === "category" ? "bg-slate-800 text-slate-50" : "text-slate-400"
              }`}
            >
              Por categoría
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] text-slate-400">Desde</label>
              <input
                type="date"
                value={repFrom}
                onChange={(e) => setRepFrom(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">Hasta</label>
              <input
                type="date"
                value={repTo}
                onChange={(e) => setRepTo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
              />
            </div>
          </div>

          {reportKind === "category" && reportContent !== "debts" && (
            <div>
              <label className="text-[11px] text-slate-400">Categoría</label>
              <select
                value={repCategory}
                onChange={(e) => setRepCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
                disabled={categoriesForFilter.length === 0}
              >
                {categoriesForFilter.length === 0 ? (
                  <option value="">Sin categorías aún</option>
                ) : (
                  categoriesForFilter.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={repLoading || !proUnlocked}
              onClick={downloadCustomReport}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-500 disabled:opacity-60"
            >
              <FileDown className="h-4 w-4" />
              {repLoading ? "Generando…" : "Descargar PDF"}
            </button>
            {!proUnlocked ? (
              <p className="w-full text-[11px] text-amber-200/90">
                PDF incluido en{" "}
                <Link href="/dashboard/billing" className="font-medium text-primary underline-offset-2 hover:underline">
                  Plan Pro
                </Link>
                .
              </p>
            ) : null}
          </div>
        </section>
      ) : tab === "overview" ? (
        <section className="mt-4 grid gap-4 md:grid-cols-[1.4fr,1.6fr]">
          <div className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">
                  Panorama mensual · {summary.monthLabel}
                </h2>
                <p className="text-[11px] text-slate-400">
                  Resumen rápido de ingresos, egresos y resultado neto.
                </p>
              </div>
            </div>
            <div className="grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-emerald-950/40 p-3 border border-emerald-900/40">
                <p className="text-[11px] text-emerald-300">Ingresos</p>
                <p className="mt-1 text-sm font-semibold text-emerald-200">
                  Q {summary.income.toLocaleString("es-GT")}
                </p>
              </div>
              <div className="rounded-xl bg-rose-950/40 p-3 border border-rose-900/40">
                <p className="text-[11px] text-rose-300">Egresos</p>
                <p className="mt-1 text-sm font-semibold text-rose-200">
                  Q {summary.expenses.toLocaleString("es-GT")}
                </p>
              </div>
              <div
                className={`rounded-xl p-3 border ${
                  isNegative
                    ? "bg-rose-950/40 border-rose-900/60"
                    : "bg-emerald-950/40 border-emerald-900/60"
                }`}
              >
                <p className="text-[11px] text-slate-200">Resultado neto</p>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    isNegative ? "text-rose-200" : "text-emerald-200"
                  }`}
                >
                  {isNegative ? "-" : "+"} Q {Math.abs(net).toLocaleString("es-GT")}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {isNegative
                    ? "Estás en números rojos este mes."
                    : "Estás generando ahorro este mes."}
                </p>
              </div>
              <div className="rounded-xl border border-amber-900/50 bg-amber-950/30 p-3">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-amber-400/90" />
                  <p className="text-[11px] text-amber-200/90">Cuentas por pagar</p>
                </div>
                <p className="mt-1 text-sm font-semibold text-amber-100">
                  Q {debtsSummary.pendingTotal.toLocaleString("es-GT")}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {debtsSummary.count === 0
                    ? "Sin deudas pendientes o vencidas."
                    : `${debtsSummary.count} obligación${debtsSummary.count === 1 ? "" : "es"} pendiente${debtsSummary.count === 1 ? "" : "s"} (saldo por cubrir).`}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  <Link href="/dashboard/debts" className="font-medium text-amber-300/90 hover:text-amber-200">
                    Agregar o revisar obligaciones
                  </Link>
                  {" · "}
                  Exporta por vencimiento en la pestaña Reporte.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4">
            <div className="mb-2 flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-slate-200">Asesor financiero (chat)</h2>
            </div>
            <p className="mb-3 text-[11px] text-slate-400">
              Pregunta lo que quieras: en qué reducir gastos, cómo ahorrar, revisar categorías, etc.
            </p>
            {!proUnlocked ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-amber-900/40 bg-amber-950/20 p-6 text-center">
                <p className="text-xs text-amber-100/90">
                  El asesor por chat forma parte del <span className="font-semibold">Plan Pro</span>.
                </p>
                <Link
                  href="/dashboard/billing"
                  className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-blue-500"
                >
                  Ver planes y suscribirme
                </Link>
              </div>
            ) : (
              <div className="flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/60">
              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {chatMessages.length === 0 && (
                  <p className="text-[11px] text-slate-500">
                    Escribe abajo tu pregunta. Por ejemplo: &quot;¿En qué puedo reducir gastos?&quot; o &quot;¿Cómo voy este mes?&quot;
                  </p>
                )}
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] ${
                        m.role === "user"
                          ? "bg-primary/90 text-primary-foreground"
                          : "bg-slate-800/80 text-slate-200"
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.content}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-slate-800/80 px-3 py-2 text-[12px] text-slate-400">
                      Pensando...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form
                className="flex gap-2 border-t border-slate-800/60 p-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pregunta sobre tus finanzas..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-slate-600 focus:outline-none"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="rounded-xl bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 md:col-span-2">
            <h2 className="mb-3 text-sm font-semibold text-slate-200">Ingresos y gastos por fecha</h2>
            <p className="mb-3 text-[11px] text-slate-400">
              Evolución diaria de los últimos 30 días.
            </p>
            <IncomeExpenseChart data={chartData} />
          </div>
        </section>
      ) : (
        <section className="mt-4 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Últimos movimientos</h2>
            <span className="text-[11px] uppercase tracking-wide text-slate-500">live</span>
          </div>

          {!transactions || transactions.length === 0 ? (
            <p className="text-xs text-slate-400">
              Aún no hay transacciones. Empieza registrando ingresos y gastos para ver tu flujo real.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/60 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-slate-100">{t.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {t.category_name || "Sin categoría"} ·{" "}
                      {t.datetime ? new Date(t.datetime).toLocaleString("es-GT") : "sin fecha"}
                    </p>
                    {t.notes ? (
                      <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{t.notes}</p>
                    ) : null}
                  </div>
                  <p
                    className={`text-xs font-semibold ${
                      t.type === "income" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"} {t.currency || "Q"}{" "}
                    {Number(t.amount).toLocaleString("es-GT")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

