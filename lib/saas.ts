import { createSupabaseServerClient } from "./supabase/server";

export async function getSubscription() {
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

export async function hasActiveSubscription() {
  const sub = await getSubscription();
  return sub?.status === "active" || sub?.status === "trialing";
}

