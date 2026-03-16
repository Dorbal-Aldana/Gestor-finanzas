import { NextResponse } from "next/server";
import { getGeminiClient } from "../../../../lib/gemini";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export async function POST() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ summary: "No autenticado." }, { status: 401 });
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
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
Eres un asesor financiero personal para un profesional de la salud (dentista).
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

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ summary: text });
  } catch {
    return NextResponse.json(
      { summary: "Hubo un error al llamar a Gemini. Revisa tu GEMINI_API_KEY." },
      { status: 500 }
    );
  }
}

