"use client"; // Convertimos a client component para manejar el estado del formulario fácilmente

import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../../lib/supabase/client";
import { updateTransaction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-blue-500 transition-colors disabled:opacity-70"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Guardando cambios..." : "Guardar cambios"}
    </button>
  );
}

export default function EditTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const [transaction, setTransaction] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    async function loadData() {
      const params = await searchParams;
      if (!params.id) {
        window.location.href = "/dashboard";
        return;
      }

      const [txRes, catRes] = await Promise.all([
        supabase.from("transactions").select("*").eq("id", params.id).single(),
        supabase.from("categories").select("id, name, type")
      ]);

      setTransaction(txRes.data);
      setCategories(catRes.data || []);
      setLoading(false);
    }
    loadData();
  }, [searchParams, supabase]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-400">Transacción no encontrada.</p>
      </div>
    );
  }

  const filteredCategories = categories.filter(c => c.type === transaction.type);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al dashboard
      </Link>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
        <h1 className="text-xl font-semibold text-slate-100">Editar movimiento</h1>
        <p className="mt-1 text-sm text-slate-400">Modifica los detalles de la transacción.</p>

        <form action={updateTransaction} className="mt-8 space-y-5">
          <input type="hidden" name="id" value={transaction.id} />
          <input type="hidden" name="type" value={transaction.type} />

          <div>
            <label className="text-xs font-medium text-slate-300">Título / Concepto</label>
            <input
              name="title"
              defaultValue={transaction.title}
              required
              className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-300">Monto</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                defaultValue={transaction.amount}
                required
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Moneda</label>
              <select
                name="currency"
                defaultValue={transaction.currency || "GTQ"}
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none"
              >
                <option value="GTQ">GTQ</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-300">Categoría</label>
              <select
                name="category_id"
                defaultValue={transaction.category_id || ""}
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none"
              >
                <option value="">Sin categoría</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Fecha y hora</label>
              <input
                name="datetime"
                type="datetime-local"
                defaultValue={transaction.datetime ? new Date(transaction.datetime).toISOString().slice(0, 16) : ""}
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Notas (opcional)</label>
            <textarea
              name="notes"
              rows={3}
              defaultValue={transaction.notes || ""}
              className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-primary"
            />
          </div>

          <SubmitButton />
        </form>
      </div>
    </main>
  );
}