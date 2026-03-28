import Link from "next/link";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { hasProAccess } from "../../lib/saas";
import { CreditCard, PlusCircle, Sparkles } from "lucide-react";
import { DashboardTabs } from "../../components/dashboard-tabs";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const { data: monthTx } = await supabase
    .from("transactions")
    .select("amount,type")
    .gte("datetime", startOfMonth.toISOString())
    .lte("datetime", endOfMonth.toISOString());

  const income =
    monthTx?.filter((t) => t.type === "income").reduce((acc, t) => acc + Number(t.amount), 0) ?? 0;
  const expenses =
    monthTx?.filter((t) => t.type === "expense").reduce((acc, t) => acc + Number(t.amount), 0) ?? 0;

  // Leer de la tabla transactions (no de la vista) y traer nombre de categoría por FK
  const { data: transactionsRaw } = await supabase
    .from("transactions")
    .select("id,title,amount,type,currency,datetime,tags,notes,categories(name)")
    .order("datetime", { ascending: false })
    .limit(50);

  const transactions = (transactionsRaw || []).map((t: any) => {
    const cat = t.categories;
    const categoryFromFk =
      cat == null ? null : Array.isArray(cat) ? (cat[0]?.name ?? null) : (cat as { name?: string }).name ?? null;
    const tags = Array.isArray(t.tags) ? t.tags : [];
    const category_name = categoryFromFk ?? (tags[0] ?? null);
    return {
      id: t.id,
      title: t.title,
      amount: t.amount,
      type: t.type,
      currency: t.currency,
      datetime: t.datetime,
      category_name,
      notes: t.notes ?? null
    };
  });

  const categoriesForFilter = Array.from(
    new Set((transactions as { category_name: string | null }[]).map((t) => t.category_name ?? "Sin categoría"))
  ) as string[];
  categoriesForFilter.sort();

  const monthLabel = startOfMonth.toLocaleDateString("es-GT", {
    month: "long",
    year: "numeric"
  });

  // Datos para el gráfico: últimos 30 días por día (ingresos y gastos)
  const chartStart = new Date(now);
  chartStart.setDate(chartStart.getDate() - 30);
  const { data: chartTx } = await supabase
    .from("transactions")
    .select("amount,type,datetime")
    .gte("datetime", chartStart.toISOString())
    .lte("datetime", endOfMonth.toISOString());

  const byDate: Record<string, { ingresos: number; gastos: number }> = {};
  const oneDay = 24 * 60 * 60 * 1000;
  for (let d = new Date(chartStart); d <= now; d.setTime(d.getTime() + oneDay)) {
    const key = d.toISOString().slice(0, 10);
    byDate[key] = { ingresos: 0, gastos: 0 };
  }
  (chartTx || []).forEach((t: { amount: number; type: string; datetime: string }) => {
    const key = t.datetime ? t.datetime.slice(0, 10) : new Date().toISOString().slice(0, 10);
    if (!byDate[key]) byDate[key] = { ingresos: 0, gastos: 0 };
    if (t.type === "income") byDate[key].ingresos += Number(t.amount);
    else byDate[key].gastos += Number(t.amount);
  });
  const chartData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date: new Date(date).toLocaleDateString("es-GT", { day: "2-digit", month: "short" }),
      ingresos: v.ingresos,
      gastos: v.gastos
    }));

  const { data: debtsOpen } = await supabase
    .from("debts")
    .select("amount_total,amount_paid,status")
    .in("status", ["pending", "overdue"]);

  let debtsPendingTotal = 0;
  for (const d of debtsOpen ?? []) {
    debtsPendingTotal += Math.max(0, Number(d.amount_total) - Number(d.amount_paid));
  }
  const debtsPendingCount = debtsOpen?.length ?? 0;

  const proUnlocked = await hasProAccess();

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-4 py-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-400">
            Bienvenido{user?.email ? `, ${user.email}` : ""}. Aquí ves tu foto general y tus movimientos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:border-primary/50 hover:bg-slate-900"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Plan Pro
          </Link>
          <Link
            href="/dashboard/debts"
            className="inline-flex items-center gap-2 rounded-full border border-amber-900/50 bg-amber-950/40 px-4 py-2 text-sm font-medium text-amber-100 hover:border-amber-700/60 hover:bg-amber-950/60"
          >
            <CreditCard className="h-4 w-4" />
            Cuentas por pagar
          </Link>
          <Link
            href="/dashboard/transactions/new"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-blue-500"
          >
            <PlusCircle className="h-4 w-4" />
            Registrar movimiento
          </Link>
        </div>
      </div>

      <DashboardTabs
        summary={{ monthLabel, income, expenses }}
        transactions={(transactions as any) || []}
        chartData={chartData}
        categoriesForFilter={categoriesForFilter}
        debtsSummary={{ count: debtsPendingCount, pendingTotal: debtsPendingTotal }}
        proUnlocked={proUnlocked}
      />
    </main>
  );
}

