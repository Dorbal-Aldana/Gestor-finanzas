import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { buildFinanceReportPdf } from "../../../lib/build-report-pdf";
import { hasProAccess } from "../../../lib/saas";

function rowCategory(t: any): string {
  const cat = t.categories;
  const categoryFromFk =
    cat == null ? null : Array.isArray(cat) ? (cat[0]?.name ?? null) : (cat as { name?: string }).name ?? null;
  const tags = Array.isArray(t.tags) ? t.tags : [];
  const raw = categoryFromFk ?? tags[0] ?? null;
  return raw != null && String(raw).trim() !== "" ? String(raw) : "Sin categoría";
}

function debtStatusLabel(s: string): string {
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

function pendingBalance(d: { amount_total: unknown; amount_paid: unknown; status: string }): number {
  if (d.status === "paid" || d.status === "cancelled") return 0;
  const total = Number(d.amount_total);
  const paid = Number(d.amount_paid);
  return Math.max(0, total - paid);
}

function clip(s: string, max: number): string {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "…";
}

export async function GET(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!(await hasProAccess())) {
    return NextResponse.json(
      {
        error: "pro_required",
        message: "Los reportes PDF son del plan Pro. Actívalo en /dashboard/billing."
      },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "month";
  const content = (url.searchParams.get("content") || "transactions").toLowerCase();
  const includeTransactions = content === "transactions" || content === "both";
  const includeDebts = content === "debts" || content === "both";

  if (!includeTransactions && !includeDebts) {
    return NextResponse.json({ error: "Parámetro content inválido." }, { status: 400 });
  }

  const now = new Date();
  let start: Date;
  let end: Date;
  let periodLabel: string;

  if (mode === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    periodLabel = start.toLocaleDateString("es-GT", { month: "long", year: "numeric" });
  } else {
    const fromStr = url.searchParams.get("from")?.trim();
    const toStr = url.searchParams.get("to")?.trim();
    if (!fromStr || !toStr) {
      return NextResponse.json({ error: "Indica fecha desde y hasta para el reporte." }, { status: 400 });
    }
    start = new Date(fromStr + "T00:00:00.000");
    end = new Date(toStr + "T23:59:59.999");
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return NextResponse.json({ error: "Rango de fechas inválido." }, { status: 400 });
    }
    periodLabel = `${fromStr} — ${toStr}`;
  }

  let categoryFilter: string | null = null;
  if (mode === "category" && includeTransactions) {
    categoryFilter = url.searchParams.get("category")?.trim() || null;
    if (!categoryFilter) {
      return NextResponse.json({ error: "Elige una categoría para el reporte." }, { status: 400 });
    }
  }

  const startDateStr = start.toISOString().slice(0, 10);
  const endDateStr = end.toISOString().slice(0, 10);

  let income = 0;
  let expenses = 0;
  let net = 0;
  const titleLine =
    mode === "category"
      ? `Reporte por categoría: ${categoryFilter}`
      : mode === "date"
        ? "Reporte por rango de fechas"
        : "Reporte de finanzas";

  const transactionRows: [string, string, string, string, string, string, string][] = [];

  if (includeTransactions) {
    const { data: rows, error } = await supabase
      .from("transactions")
      .select("title,amount,type,currency,datetime,tags,notes,categories(name)")
      .gte("datetime", start.toISOString())
      .lte("datetime", end.toISOString())
      .order("datetime", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "No se pudieron cargar las transacciones" },
        { status: 500 }
      );
    }

    let filtered = rows ?? [];
    if (mode === "category" && categoryFilter) {
      filtered = filtered.filter((t: any) => rowCategory(t) === categoryFilter);
    }

    income =
      filtered.filter((t: any) => t.type === "income").reduce((a: number, t: any) => a + Number(t.amount), 0) ?? 0;
    expenses =
      filtered.filter((t: any) => t.type === "expense").reduce((a: number, t: any) => a + Number(t.amount), 0) ?? 0;
    net = income - expenses;

    for (const t of filtered) {
      const category = rowCategory(t);
      const date = (t as any).datetime
        ? new Date((t as any).datetime).toLocaleString("es-GT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })
        : "";
      const desc =
        (t as any).notes != null && String((t as any).notes).trim() !== "" ? String((t as any).notes) : "";
      transactionRows.push([
        date,
        (t as any).type === "income" ? "Ingreso" : "Gasto",
        clip((t as any).title ?? "", 48),
        clip(category, 32),
        clip(desc, 120),
        Number((t as any).amount).toFixed(2),
        String((t as any).currency ?? "GTQ")
      ]);
    }
  }

  let debtRows: any[] = [];
  if (includeDebts) {
    const { data: debts, error: debtErr } = await supabase
      .from("debts")
      .select("title,description,amount_total,amount_paid,currency,due_date,status")
      .gte("due_date", startDateStr)
      .lte("due_date", endDateStr)
      .order("due_date", { ascending: true });

    if (debtErr) {
      return NextResponse.json(
        { error: "No se pudieron cargar las cuentas por pagar" },
        { status: 500 }
      );
    }
    debtRows = debts ?? [];
  }

  const debtPendingTotal = debtRows.reduce((a, d) => a + pendingBalance(d), 0);

  const debtTableRows: [string, string, string, string, string, string, string, string][] = debtRows.map((d) => {
    const bal = pendingBalance(d);
    const due = d.due_date
      ? new Date(d.due_date + "T12:00:00").toLocaleDateString("es-GT", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        })
      : "";
    return [
      clip(d.title ?? "", 40),
      clip(d.description ?? "", 100),
      Number(d.amount_total).toFixed(2),
      Number(d.amount_paid).toFixed(2),
      bal.toFixed(2),
      String(d.currency ?? "GTQ"),
      due,
      debtStatusLabel(d.status ?? "")
    ];
  });

  const pdfBuffer = buildFinanceReportPdf({
    titleLine,
    periodLabel,
    includeTransactions,
    income,
    expenses,
    net,
    transactionRows,
    includeDebts,
    debtCount: debtRows.length,
    debtPendingTotal,
    debtRows: debtTableRows
  });

  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  const fromParam = url.searchParams.get("from")?.trim();
  const toParam = url.searchParams.get("to")?.trim();
  const safeCat = (categoryFilter ?? "todas").replace(/[^\w\-áéíóúñÁÉÍÓÚÑ]+/g, "_").slice(0, 48);
  const slug =
    mode === "month"
      ? `${y}-${m}`
      : mode === "category"
        ? `cat-${safeCat}`
        : `fechas-${fromParam ?? "ini"}-${toParam ?? "fin"}`;

  let filename: string;
  if (includeTransactions && includeDebts) {
    filename = `reporte-finanzas-${slug}-con-deudas.pdf`;
  } else if (includeDebts) {
    filename = `reporte-cuentas-por-pagar-${slug}.pdf`;
  } else {
    filename = `reporte-finanzas-${slug}.pdf`;
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
