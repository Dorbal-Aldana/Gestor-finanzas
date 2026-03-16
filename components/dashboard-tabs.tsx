"use client";

import { useState } from "react";
import { BrainCircuit } from "lucide-react";

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
  transactions
}: {
  summary: SummaryProps;
  transactions: Transaction[];
}) {
  const [tab, setTab] = useState<"overview" | "movements">("overview");
  const [aiText, setAiText] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const net = summary.income - summary.expenses;
  const isNegative = net < 0;

  const handleAi = async () => {
    setLoadingAi(true);
    setAiText("Analizando tus movimientos con Gemini...");
    try {
      const res = await fetch("/api/ai/summary", { method: "POST" });
      const json = await res.json();
      setAiText(json.summary || "No se pudo generar el análisis.");
    } catch {
      setAiText("Error al generar el análisis con IA.");
    } finally {
      setLoadingAi(false);
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

          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Asesor financiero IA</h2>
              <button
                type="button"
                onClick={handleAi}
                disabled={loadingAi}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:border-slate-500 disabled:opacity-60"
              >
                <BrainCircuit className="h-3 w-3 text-primary" />
                {loadingAi ? "Analizando..." : "Pedir consejo"}
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Gemini analiza tus ingresos y egresos recientes y te sugiere en qué gastar menos, cómo
              equilibrar tus categorías y qué riesgos ve en tus deudas.
            </p>
            <div className="mt-3 rounded-xl bg-slate-950/70 p-3 text-[11px] text-slate-300 whitespace-pre-line">
              {aiText ||
                "Pulsa \"Pedir consejo\" y aquí aparecerá el análisis personalizado de tu situación financiera."}
            </div>
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

