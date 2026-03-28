import { createSupabaseServerClient } from "./supabase/server";

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
 * Usar en APIs y UI para features Pro (IA, PDF). Respeta SAAS_DEV_UNLOCK=1 en servidor.
 */
export async function hasProAccess(): Promise<boolean> {
  if (process.env.SAAS_DEV_UNLOCK === "1") return true;
  return hasActiveSubscription();
}
