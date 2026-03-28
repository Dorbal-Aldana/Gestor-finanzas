import { createSupabaseServerClient } from "./supabase/server";

function parseEnvList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Pro sin pago: lista en env (UUIDs de Supabase Auth o correos), separados por coma.
 */
export function complimentaryProGranted(
  userId: string | undefined,
  email: string | null | undefined
): boolean {
  const ids = parseEnvList(process.env.SAAS_COMPLIMENTARY_USER_IDS);
  const emails = parseEnvList(process.env.SAAS_COMPLIMENTARY_EMAILS);
  if (userId && ids.includes(userId.toLowerCase())) return true;
  const em = email?.trim().toLowerCase();
  if (em && emails.includes(em)) return true;
  return false;
}

export type SubscriptionRow = {
  plan: string;
  status: string;
  current_period_end: string | null;
};

export async function getSubscription(): Promise<SubscriptionRow | null> {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data } = await supabase
    .from("subscriptions")
    .select("plan,status,current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  return data ?? null;
}

/** Acceso real a Pro según fila en Supabase (sin bypass de desarrollo). */
export function subscriptionGrantsProAccess(sub: SubscriptionRow | null): boolean {
  if (!sub) return false;
  const st = sub.status;
  if (st === "active" || st === "trialing" || st === "past_due") return true;
  if (st === "canceled" && sub.current_period_end) {
    const end = new Date(sub.current_period_end).getTime();
    if (!Number.isNaN(end) && end > Date.now()) return true;
  }
  return false;
}

export async function hasActiveSubscription(): Promise<boolean> {
  const sub = await getSubscription();
  return subscriptionGrantsProAccess(sub);
}

/**
 * Usar en APIs y UI para features Pro (IA, PDF).
 * Orden: SAAS_DEV_UNLOCK → cortesía por env → suscripción en Supabase.
 */
export async function hasProAccess(): Promise<boolean> {
  if (process.env.SAAS_DEV_UNLOCK === "1") return true;
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return false;
  if (complimentaryProGranted(user.id, user.email)) return true;
  const { data } = await supabase
    .from("subscriptions")
    .select("plan,status,current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  return subscriptionGrantsProAccess(data ?? null);
}
