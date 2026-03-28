import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import { CategorySelector } from "../../../../components/category-selector";

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

  async function createTransaction(formData: FormData) {
    "use server";
    const supabaseAuth = createSupabaseServerClient();
    const { data: userData } = await supabaseAuth.auth.getUser();
    const user = userData.user;
    if (!user) redirect("/sign-in");

    const title = String(formData.get("title") || "").trim();
    const amount = Number(formData.get("amount") || 0);
    const type = String(formData.get("type") || "expense");
    const currency = String(formData.get("currency") || "GTQ");
    const category = String(formData.get("category") || "").trim();
    const notesRaw = String(formData.get("notes") || "").trim();
    const notes = notesRaw.length > 0 ? notesRaw : null;

    if (!title || !Number.isFinite(amount) || amount <= 0) {
      redirect("/dashboard/transactions/new?error=invalid");
    }

    const payload = {
      user_id: user.id,
      title,
      amount,
      type,
      currency,
      datetime: new Date().toISOString(),
      tags: category ? [category] : [],
      notes
    };

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (url && serviceKey) {
      const admin = createClient(url, serviceKey);
      const { error } = await admin.from("transactions").insert(payload);
      if (error) {
        redirect(`/dashboard/transactions/new?error=save&msg=${encodeURIComponent(error.message)}`);
      }
    } else {
      const { error } = await supabaseAuth.from("transactions").insert(payload);
      if (error) {
        redirect(`/dashboard/transactions/new?error=save&msg=${encodeURIComponent(error.message)}`);
      }
    }

    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al dashboard
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo ingreso o gasto</h1>
        <p className="text-sm text-slate-400">Elige una etiqueta o escribe la tuya en «Otro».</p>
      </div>

      {errorParam === "save" && (
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          <p className="font-medium">No se pudo guardar.</p>
          {errorMsg ? (
            <p className="mt-1 break-all text-xs opacity-90">{decodeURIComponent(errorMsg)}</p>
          ) : (
            <p className="mt-1">Revisa que SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén en .env.local.</p>
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
            placeholder="Ej. Pago alquiler, Venta consulta..."
          />
        </div>

        <div>
          <label className="text-xs text-slate-300">Monto</label>
          <input
            name="amount"
            required
            type="number"
            step="0.01"
            min="0.01"
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="text-xs text-slate-300">Descripción (opcional)</label>
          <textarea
            name="notes"
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600 placeholder:text-slate-600"
            placeholder="Detalle del pago o movimiento…"
          />
        </div>

        <CategorySelector />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-600 bg-transparent px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-800/50 sm:w-auto"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-500 sm:w-auto sm:min-w-[140px]"
          >
            Guardar
          </button>
        </div>
      </form>
    </main>
  );
}
