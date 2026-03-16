import Link from "next/link";
import { ArrowRight, BarChart3, Bell, BrainCircuit, Wallet } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold tracking-tight">Gestor Finanzas</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-blue-500">
              Ir al dashboard
            </Link>
          </nav>
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Control total de tu patrimonio,
              <span className="block text-primary">diseñado para profesionales.</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base">
              Registra ingresos y gastos por clínica, alquileres e inversiones. Recibe alertas de deudas y reportes
              inteligentes impulsados por IA.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-blue-500"
              >
                Empezar ahora
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-xs text-slate-400">Sin tarjeta en la versión demo.</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Reportes por categoría y subcategoría
              </span>
              <span className="inline-flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" /> Alertas de deudas y pagos fijos
              </span>
              <span className="inline-flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-primary" /> Insights con IA de Gemini
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
              <span>Resumen mensual (ejemplo)</span>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-400">+18.3% ahorro</span>
            </div>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between">
                <span>Ingresos totales</span>
                <span className="font-semibold text-emerald-400">Q 45,300</span>
              </div>
              <div className="flex justify-between">
                <span>Gastos totales</span>
                <span className="font-semibold text-rose-400">Q 27,850</span>
              </div>
              <div className="flex justify-between">
                <span>Ahorro neto</span>
                <span className="font-semibold text-sky-400">Q 17,450</span>
              </div>
              <div className="mt-2 rounded-xl bg-slate-950/60 p-3 text-slate-300">
                <p className="mb-1 text-xs font-semibold text-slate-200">Insight de IA (demo)</p>
                <p className="text-[11px] leading-relaxed">
                  Tus alquileres (Casa Amatitlán) cubren el 42% de tus gastos fijos. Si mantienes este nivel, podrías
                  adelantar 3 meses el pago de tu deuda principal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

