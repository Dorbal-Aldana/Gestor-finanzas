import { NextResponse } from "next/server";
import { getMistralClient } from "../../../../lib/mistral";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import { hasProAccess } from "../../../../lib/saas";

export async function POST() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ summary: "No autenticado." }, { status: 401 });
  }

  if (!(await hasProAccess())) {
    return NextResponse.json(
      {
        summary:
          "El resumen con IA es del plan Pro. Consíguelo en Plan y facturación (/dashboard/billing).",
        error: "pro_required"
      },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, currency, datetime, title")
    .order("datetime", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { summary: "No se pudieron leer las transacciones para el resumen de IA." },
      { status: 500 }
    );
  }

  try {
    const mistral = getMistralClient();
    const model = process.env.MISTRAL_MODEL || "mistral-small-latest";

    const prompt = `Eres un asesor financiero personal para un profesional de la salud (dentista).
Te paso una lista de transacciones recientes en formato JSON. Cada transacción tiene:
- type: "income" o "expense"
- amount
- currency
- datetime

Analiza el flujo de caja, hábitos de gasto y posibles riesgos.
Responde en español, en un tono claro y directo, en 3-5 viñetas.

Transacciones:
${JSON.stringify(data ?? [])}
`;

    const result = await mistral.chat.complete({
      model,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = result.choices?.[0]?.message?.content;
    const text = typeof raw === "string"
      ? raw.trim()
      : Array.isArray(raw)
        ? String(
            (raw as { type?: string; text?: string }[]).find((c) => c.type === "text")?.text ?? ""
          ).trim()
        : "";
    const summary = text || "No se pudo generar el resumen.";

    return NextResponse.json({ summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        summary: `Error de Mistral: ${message}. Comprueba MISTRAL_API_KEY en .env.local (consíguela en https://console.mistral.ai).`,
      },
      { status: 500 }
    );
  }
}
