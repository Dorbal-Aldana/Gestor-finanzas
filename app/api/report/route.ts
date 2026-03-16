import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function escapeCsv(value: string): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const monthLabel = startOfMonth.toLocaleDateString("es-GT", {
    month: "long",
    year: "numeric"
  });

  const { data: rows, error } = await supabase
    .from("transactions")
    .select("title,amount,type,currency,datetime,tags,categories(name)")
    .gte("datetime", startOfMonth.toISOString())
    .lte("datetime", endOfMonth.toISOString())
    .order("datetime", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar las transacciones" },
      { status: 500 }
    );
  }

  const income =
    (rows ?? []).filter((t: any) => t.type === "income").reduce((a: number, t: any) => a + Number(t.amount), 0) ?? 0;
  const expenses =
    (rows ?? []).filter((t: any) => t.type === "expense").reduce((a: number, t: any) => a + Number(t.amount), 0) ?? 0;
  const net = income - expenses;

  const lines: string[] = [
    "Reporte de finanzas",
    escapeCsv(`Período: ${monthLabel}`),
    escapeCsv(`Total ingresos: ${income.toFixed(2)}`),
    escapeCsv(`Total gastos: ${expenses.toFixed(2)}`),
    escapeCsv(`Resultado neto: ${net.toFixed(2)}`),
    "",
    "Fecha,Tipo,Título,Categoría,Monto,Moneda"
  ];

  for (const t of rows ?? []) {
    const cat = (t as any).categories;
    const categoryFromFk =
      cat == null ? null : Array.isArray(cat) ? (cat[0]?.name ?? null) : (cat as { name?: string }).name ?? null;
    const tags = Array.isArray((t as any).tags) ? (t as any).tags : [];
    const category = categoryFromFk ?? (tags[0] ?? "") ?? "";
    const date = (t as any).datetime
      ? new Date((t as any).datetime).toLocaleString("es-GT", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      : "";
    lines.push(
      [
        escapeCsv(date),
        (t as any).type === "income" ? "Ingreso" : "Gasto",
        escapeCsv((t as any).title ?? ""),
        escapeCsv(category),
        Number((t as any).amount).toFixed(2),
        (t as any).currency ?? "GTQ"
      ].join(",")
    );
  }

  const csv = lines.join("\r\n");
  const filename = `reporte-finanzas-${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, "0")}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
