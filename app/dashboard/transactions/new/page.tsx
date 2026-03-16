import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

const DEFAULT_CATEGORIES: { name: string; type: "income" | "expense" }[] = [
  { name: "Clínica", type: "income" },
  { name: "Alquileres", type: "income" },
  { name: "Inversiones", type: "income" },
  { name: "Otros ingresos", type: "income" },
  { name: "Gastos fijos", type: "expense" },
  { name: "Suministros", type: "expense" },
  { name: "Personal", type: "expense" },
  { name: "Servicios", type: "expense" },
  { name: "Otros gastos", type: "expense" }
];

export default async function NewTransactionPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; msg?: string }>;
}) {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/sign-in");

  const { error: errorParam, msg: errorMsg } = await searchParams;

  // Asegurar al menos una cuenta "Registro personal" (así no hace falta account_id nullable)
  const { data: existingAccounts } = await supabase.from("accounts").select("id").limit(1);
  if (!existingAccounts?.length) {
    await supabase.from("accounts").insert({
      user_id: user.id,
      name: "Registro personal",
      type: "cash",
      currency: "GTQ",
      initial_balance: 0
    });
  }

  // Asegurar categorías por defecto si no tiene ninguna
  const { data: existingCategories } = await supabase.from("categories").select("id").limit(1);
  if (!existingCategories?.length) {
    await supabase.from("categories").insert(
      DEFAULT_CATEGORIES.map((c) => ({
        user_id: user.id,
        name: c.name,
        type: c.type
      }))
    );
  }

  const { data: accounts } = await supabase.from("accounts").select("id,name,currency").order("created_at");
  const { data: categories } = await supabase
    .from("categories")
    .select("id,name,type")
    .order("type")
    .order("created_at");

  async function createTransaction(formData: FormData) {
    "use server";
    const supabase = createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) redirect("/sign-in");

    const title = String(formData.get("title") || "").trim();
    const amount = Number(formData.get("amount") || 0);
    const type = String(formData.get("type") || "expense");
    const currency = String(formData.get("currency") || "GTQ");
    const rawAccountId = String(formData.get("account_id") || "").trim();
    const rawCategoryId = String(formData.get("category_id") || "").trim();
    const category_id = rawCategoryId === "" ? null : rawCategoryId;

    if (!title || !Number.isFinite(amount) || amount <= 0) {
      redirect("/dashboard/transactions/new?error=invalid");
    }

    // Siempre usar una cuenta: si eligió "Sin cuenta" usamos la primera (Registro personal)
    let account_id = rawAccountId === "" ? null : rawAccountId;
    if (!account_id) {
      const { data: firstAccount } = await supabase
        .from("accounts")
        .select("id")
        .limit(1)
        .maybeSingle();
      account_id = firstAccount?.id ?? null;
    }

    if (!account_id) {
      redirect("/dashboard/transactions/new?error=save");
    }

    const payload = {
      user_id: user.id,
      title,
      amount,
      type,
      currency,
      account_id,
      datetime: new Date().toISOString()
    } as Record<string, unknown>;
    if (category_id != null) payload.category_id = category_id;

    let result = await supabase.from("transactions").insert(payload);

    // Si falla por RLS u otra política, intentar con service role (mismo user_id desde sesión)
    if (result.error && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      result = await admin.from("transactions").insert(payload);
    }

    if (result.error) {
      const msg = encodeURIComponent(result.error.message);
      redirect(`/dashboard/transactions/new?error=save&msg=${msg}`);
    }

    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva transacción</h1>
        <p className="text-sm text-slate-400">Crea un ingreso o gasto con fecha/hora exacta (por ahora: ahora).</p>
      </div>

      {errorParam === "save" && (
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          <p className="font-medium">No se pudo guardar.</p>
          {errorMsg ? (
            <p className="mt-1 break-all text-xs opacity-90">{decodeURIComponent(errorMsg)}</p>
          ) : (
            <p className="mt-1">Comprueba que exista tu perfil y al menos una cuenta (si no, recarga la página e intenta de nuevo).</p>
          )}
        </div>
      )}
      {errorParam === "invalid" && (
        <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          Título y monto son obligatorios; el monto debe ser mayor a 0.
        </div>
      )}

      <form action={createTransaction} className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-300">Tipo</label>
            <select name="type" className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm">
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-300">Moneda</label>
            <select name="currency" className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm">
              <option value="GTQ">GTQ</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-300">Título</label>
          <input
            name="title"
            required
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
            placeholder="Ej. Pago de alquiler Casa Amatitlán"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-300">Monto</label>
            <input
              name="amount"
              required
              type="number"
              step="0.01"
              min="0"
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">Cuenta</label>
            <select
              name="account_id"
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm"
            >
              {(accounts || []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              &quot;Registro personal&quot; sirve para anotar gastos/ingresos sin asociar un banco. Puedes crear más en Cuentas.
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-300">Categoría</label>
          <select name="category_id" className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm">
            <option value="">Sin categoría</option>
            {(categories || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        <button className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-500">
          Guardar
        </button>
      </form>
    </main>
  );
}

