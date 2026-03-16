import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export default async function AccountsPage() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/sign-in");

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id,name,type,currency,initial_balance,created_at")
    .order("created_at", { ascending: true });

  async function createAccount(formData: FormData) {
    "use server";
    const supabase = createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) redirect("/sign-in");

    const name = String(formData.get("name") || "").trim();
    const type = String(formData.get("type") || "bank");
    const currency = String(formData.get("currency") || "GTQ");
    const initial_balance = Number(formData.get("initial_balance") || 0);

    if (!name) return;

    await supabase.from("accounts").insert({
      user_id: user.id,
      name,
      type,
      currency,
      initial_balance
    });

    redirect("/dashboard/accounts");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cuentas</h1>
        <p className="text-sm text-slate-400">
          Define tus cuentas bancarias, efectivo y tarjetas. Luego podrás usarlas al registrar movimientos.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-[1.2fr,1.8fr]">
        <form
          action={createAccount}
          className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5 text-sm"
        >
          <h2 className="text-sm font-semibold text-slate-200">Nueva cuenta</h2>
          <div>
            <label className="text-xs text-slate-300">Nombre</label>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
              placeholder="Ej. Cuenta clínica Banrural"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs text-slate-300">Tipo</label>
              <select
                name="type"
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm"
              >
                <option value="bank">Banco</option>
                <option value="cash">Efectivo</option>
                <option value="credit_card">Tarjeta de crédito</option>
                <option value="investment">Inversión</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300">Moneda</label>
              <select
                name="currency"
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm"
              >
                <option value="GTQ">GTQ</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-300">Saldo inicial</label>
            <input
              name="initial_balance"
              type="number"
              step="0.01"
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
              placeholder="0.00"
            />
          </div>

          <button className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-500">
            Guardar cuenta
          </button>
        </form>

        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5 text-xs">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Tus cuentas</h2>
          {!accounts || accounts.length === 0 ? (
            <p className="text-slate-400">Aún no tienes cuentas. Crea al menos una para registrar ingresos y egresos.</p>
          ) : (
            <div className="space-y-2">
              {accounts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/70 px-3 py-2"
                >
                  <div>
                    <p className="text-slate-50 font-medium">{a.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {a.type} · {a.currency} · creado el{" "}
                      {a.created_at ? new Date(a.created_at as string).toLocaleDateString("es-GT") : ""}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Saldo inicial: {a.currency} {Number(a.initial_balance).toLocaleString("es-GT")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

