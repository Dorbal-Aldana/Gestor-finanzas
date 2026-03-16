"use client";

import { useState, useRef, useEffect } from "react";
import { BrainCircuit, Send } from "lucide-react";
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
};

type SummaryProps = {
  monthLabel: string;
  income: number;
  expenses: number;
};

export function DashboardTabs({
  summary,
  transactions,
  chartData = []
}: {
  summary: SummaryProps;
  transactions: Transaction[];
  chartData?: ChartPoint[];
}) {
  const [tab, setTab] = useState<"overview" | "movements">("overview");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const net = summary.income - summary.expenses;
  const isNegative = net < 0;

  const handleSendChat = async () => {
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
      </div>

      {tab === "overview" ? (
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
            <div className="grid gap-3 text-xs md:grid-cols-3">
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

