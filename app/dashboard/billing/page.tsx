import Link from "next/link";
import Script from "next/script";
import { Sparkles, Check } from "lucide-react";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import {
  complimentaryProGranted,
  getSubscription,
  hasActiveSubscription
} from "../../../lib/saas";
import { buildLemonCheckoutUrl } from "../../../lib/lemon-checkout";
import { cancelProSubscription } from "./actions";

export default async function BillingPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; msg?: string; success?: string }>;
}) {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  const params = await searchParams;

  const sub = await getSubscription();
  const paidActive = await hasActiveSubscription();
  const devUnlock = process.env.SAAS_DEV_UNLOCK === "1";
  const complimentary = complimentaryProGranted(user?.id, user?.email);
  const checkoutBase = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL?.trim();

  const checkoutHref =
    user && checkoutBase
      ? buildLemonCheckoutUrl({
          checkoutBaseUrl: checkoutBase,
          userId: user.id,
          email: user.email,
          plan: "pro"
        })
      : null;

  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleString("es-GT", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <Script src="https://assets.lemonsqueezy.com/lemon.js" strategy="afterInteractive" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plan y facturación</h1>
          <p className="text-sm text-slate-400">
            Plan gratuito para registrar finanzas; Pro desbloquea IA y exportación PDF.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-400 hover:text-slate-200"
        >
          ← Dashboard
        </Link>
      </div>

      {params.success === "cancel_requested" ? (
        <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
          Se solicitó la cancelación de Pro en Lemon Squeezy. El estado se actualizará al llegar el webhook.
        </div>
      ) : null}
      {params.success === "already_canceled" ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
          Tu suscripción ya estaba cancelada o inactiva.
        </div>
      ) : null}
      {params.error === "cancel_missing_api_key" ? (
        <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          Falta configurar <code className="rounded bg-slate-950/80 px-1">LEMON_SQUEEZY_API_KEY</code> en el
          servidor para cancelar desde la app.
        </div>
      ) : null}
      {params.error === "cancel_missing_subscription" ? (
        <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          No se encontró una suscripción activa de Lemon Squeezy para este usuario.
        </div>
      ) : null}
      {params.error === "cancel_failed" ? (
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          No se pudo cancelar. {params.msg ? decodeURIComponent(params.msg) : "Intenta de nuevo en unos minutos."}
        </div>
      ) : null}

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
            <span className="text-slate-400">Suscripción de pago activa:</span> {paidActive ? "Sí" : "No"}
          </div>
          {periodEnd ? (
            <div>
              <span className="text-slate-400">Próximo fin de periodo / acceso:</span> {periodEnd}
            </div>
          ) : null}
          {complimentary ? (
            <div className="rounded-lg border border-sky-900/50 bg-sky-950/30 px-3 py-2 text-xs text-sky-200/90">
              Tienes acceso Pro por cortesía (SAAS_COMPLIMENTARY_USER_IDS o SAAS_COMPLIMENTARY_EMAILS). No
              necesitas suscripción en Lemon.
            </div>
          ) : null}
          {devUnlock ? (
            <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-200/90">
              SAAS_DEV_UNLOCK=1: las funciones Pro están desbloqueadas en este entorno.
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-5">
          <h2 className="text-sm font-semibold text-slate-300">Gratis</h2>
          <p className="mt-2 text-xs text-slate-400">
            Cuentas, categorías, movimientos, cuentas por pagar y resumen en dashboard.
          </p>
          <ul className="mt-4 space-y-2 text-xs text-slate-300">
            <li className="flex gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" /> Registro ilimitado de transacciones
            </li>
            <li className="flex gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" /> Deudas y cuotas
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 ring-1 ring-primary/20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-slate-100">Pro</h2>
            {paidActive || devUnlock || complimentary ? (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                Activo
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Asesor por chat (Mistral), resúmenes con IA y reportes PDF personalizados.
          </p>
          <ul className="mt-4 space-y-2 text-xs text-slate-300">
            <li className="flex gap-2">
              <Check className="h-4 w-4 shrink-0 text-primary" /> Chat financiero con contexto de tus datos
            </li>
            <li className="flex gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" /> Registro ilimitado de transacciones
            </li>
            <li className="flex gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" /> Deudas y cuotas
            </li>
            <li className="flex gap-2">
              <Check className="h-4 w-4 shrink-0 text-primary" /> Descarga de reportes en PDF
            </li>
          </ul>

          <div className="mt-5 space-y-3">
            {!checkoutBase ? (
              <p className="text-xs text-amber-200/80">
                Configura{" "}
                <code className="rounded bg-slate-950/80 px-1 py-0.5 text-[10px]">
                  NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL
                </code>{" "}
                en el servidor (URL de checkout del variant en Lemon Squeezy).
              </p>
            ) : null}
            {checkoutHref ? (
              <a
                href={checkoutHref}
                className="lemonsqueezy-button inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-blue-500"
              >
                {paidActive ? "Gestionar pago (checkout Lemon)" : "Pasarse a Pro — Pagar con Lemon"}
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-500"
              >
                Checkout no configurado
              </button>
            )}
            {paidActive && !devUnlock && !complimentary ? (
              <form action={cancelProSubscription}>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-rose-800/70 bg-rose-950/30 px-4 py-2.5 text-sm font-semibold text-rose-200 hover:bg-rose-950/50"
                >
                  Cancelar Plan Pro
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
