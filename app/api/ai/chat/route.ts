import { NextResponse } from "next/server";
import { getMistralClient } from "../../../../lib/mistral";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ reply: "No autenticado." }, { status: 401 });
  }

  let body: { message?: string; history?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ reply: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  const message = String(body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ reply: "Escribe una pregunta o mensaje." }, { status: 400 });
  }

  const history = Array.isArray(body.history) ? body.history : [];

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("type, amount, currency, datetime, title, tags")
    .order("datetime", { ascending: false })
    .limit(150);

  if (error) {
    return NextResponse.json(
      { reply: "No se pudieron cargar tus datos financieros. Intenta más tarde." },
      { status: 500 }
    );
  }

  const list = (transactions ?? []).map((t: any) => ({
    type: t.type,
    amount: t.amount,
    currency: t.currency || "GTQ",
    date: t.datetime,
    title: t.title,
    category: Array.isArray(t.tags) && t.tags[0] ? t.tags[0] : null,
  }));

  const totalIncome = list.filter((t: any) => t.type === "income").reduce((a: number, t: any) => a + Number(t.amount), 0);
  const totalExpense = list.filter((t: any) => t.type === "expense").reduce((a: number, t: any) => a + Number(t.amount), 0);
  const byCategory: Record<string, number> = {};
  list.filter((t: any) => t.type === "expense").forEach((t: any) => {
    const cat = t.category || "Sin categoría";
    byCategory[cat] = (byCategory[cat] || 0) + Number(t.amount);
  });

  const systemPrompt = `Eres un asesor financiero personal amigable y claro. El usuario te hace preguntas sobre sus finanzas.

Tienes estos datos del usuario (transacciones recientes y resúmenes):
- Total ingresos (reciente): ${totalIncome.toFixed(2)} GTQ
- Total gastos (reciente): ${totalExpense.toFixed(2)} GTQ
- Gastos por categoría: ${JSON.stringify(byCategory)}
- Lista de transacciones (últimas): ${JSON.stringify(list.slice(0, 80))}

Responde siempre en español, de forma directa y útil. Si pide ideas para reducir gastos, sugiere basándote en sus categorías y montos. Si pregunta por algo que no se puede deducir de los datos, dilo con naturalidad y da consejos generales. No inventes cifras que no estén en los datos.`;

  try {
    const mistral = getMistralClient();
    const model = process.env.MISTRAL_MODEL || "mistral-small-latest";

    const messages: { role: "user" | "assistant" | "system"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-20)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: String(m.content ?? ""),
        })),
      { role: "user", content: message },
    ];

    const result = await mistral.chat.complete({
      model,
      messages,
    });

    const raw = result.choices?.[0]?.message?.content;
    const text =
      typeof raw === "string"
        ? raw.trim()
        : Array.isArray(raw)
          ? (raw.find((c: { type?: string; text?: string }) => c.type === "text")?.text ?? "").trim()
          : "";
    const reply = text || "No pude generar una respuesta. Prueba a reformular tu pregunta.";

    return NextResponse.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        reply: `Error al conectar con el asesor: ${msg}. Comprueba MISTRAL_API_KEY en .env.local.`,
      },
      { status: 500 }
    );
  }
}
