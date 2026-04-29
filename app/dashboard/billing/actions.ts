"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function toErrorMessage(status: number, body: string): string {
  if (!body) return `Lemon Squeezy respondió con estado ${status}.`;
  try {
    const parsed = JSON.parse(body) as { errors?: Array<{ detail?: string; title?: string }> };
    const detail = parsed.errors?.[0]?.detail || parsed.errors?.[0]?.title;
    if (detail) return detail;
  } catch {
    // Non-JSON response; keep fallback below.
  }
  return `Lemon Squeezy respondió con estado ${status}.`;
}

export async function cancelProSubscription() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/sign-in");

  const { data: sub, error } = await supabase
    .from("subscriptions")
    .select("provider,provider_subscription_id,status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    redirect(`/dashboard/billing?error=cancel_failed&msg=${encodeURIComponent(error.message)}`);
  }
  if (!sub || sub.provider !== "lemon_squeezy" || !sub.provider_subscription_id) {
    redirect("/dashboard/billing?error=cancel_missing_subscription");
  }
  if (sub.status === "canceled" || sub.status === "inactive") {
    redirect("/dashboard/billing?success=already_canceled");
  }

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY?.trim();
  if (!apiKey) {
    redirect("/dashboard/billing?error=cancel_missing_api_key");
  }

  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${encodeURIComponent(sub.provider_subscription_id)}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`
      },
      cache: "no-store"
    }
  );

  if (!response.ok && response.status !== 404) {
    const body = await response.text();
    const msg = toErrorMessage(response.status, body);
    redirect(`/dashboard/billing?error=cancel_failed&msg=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/billing");
  redirect("/dashboard/billing?success=cancel_requested");
}
