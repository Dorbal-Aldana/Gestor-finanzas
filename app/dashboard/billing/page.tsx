import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { hasActiveSubscription, getSubscription } from "../../../lib/saas";

export default async function BillingPage() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const active = await hasActiveSubscription();
  const sub = await getSubscription();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plan y facturación</h1>
        <p className="text-sm text-slate-400">SaaS listo: aquí se gestiona suscripción y desbloqueo de features.</p>
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5 text-sm text-slate-200">
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-slate-400">Usuario:</span> {user?.email || "—"}
          </div>
          <div>
            <span className="text-slate-400">Plan:</span> {sub?.plan || "free"}
          </div>
          <div>
            <span className="text-slate-400">Estado:</span> {sub?.status || "inactive"}
          </div>
          <div>
            <span className="text-slate-400">Activo:</span> {active ? "Sí" : "No"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
        <h2 className="text-sm font-semibold text-slate-200">Checkout</h2>
        <p className="mt-1 text-xs text-slate-400">
          En producción, este botón abriría el checkout de Lemon Squeezy y el webhook actualizaría tu tabla
          `subscriptions`.
        </p>
        <button
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground opacity-60"
          disabled
        >
          Suscribirme (pendiente de configurar Lemon)
        </button>
      </div>
    </main>
  );
}

