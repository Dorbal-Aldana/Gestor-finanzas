import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export default async function CategoriesPage() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/sign-in");

  const { data: categories } = await supabase
    .from("categories")
    .select("id,name,type,created_at")
    .order("created_at", { ascending: true });

  async function createCategory(formData: FormData) {
    "use server";
    const supabase = createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) redirect("/sign-in");

    const name = String(formData.get("name") || "").trim();
    const type = String(formData.get("type") || "expense");

    if (!name) return;

    await supabase.from("categories").insert({
      user_id: user.id,
      name,
      type
    });

    redirect("/dashboard/categories");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
        <p className="text-sm text-slate-400">
          Agrupa tus ingresos y gastos (Clínica, Alquileres, Inversiones, Gastos fijos, etc.).
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-[1.2fr,1.8fr]">
        <form
          action={createCategory}
          className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5 text-sm"
        >
          <h2 className="text-sm font-semibold text-slate-200">Nueva categoría</h2>
          <div>
            <label className="text-xs text-slate-300">Nombre</label>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
              placeholder="Ej. Alquileres, Clínica, Inversiones"
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">Tipo</label>
            <select
              name="type"
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm"
            >
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
          </div>

          <button className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-500">
            Guardar categoría
          </button>
        </form>

        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5 text-xs">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Tus categorías</h2>
          {!categories || categories.length === 0 ? (
            <p className="text-slate-400">Aún no tienes categorías. Crea algunas para organizar tus movimientos.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/70 px-3 py-2"
                >
                  <div>
                    <p className="text-slate-50 font-medium">{c.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {c.type === "income" ? "Ingreso" : "Gasto"} ·{" "}
                      {c.created_at ? new Date(c.created_at as string).toLocaleDateString("es-GT") : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

