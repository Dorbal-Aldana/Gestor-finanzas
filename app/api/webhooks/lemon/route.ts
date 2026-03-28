import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

type LemonAttrs = {
  customer_id?: number | string;
  user_email?: string;
  status?: string;
  renews_at?: string | null;
  ends_at?: string | null;
  trial_ends_at?: string | null;
};

function verifySignature(payload: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload, "utf8");
  const digest = Buffer.from(hmac.digest("hex"), "utf8");
  const sigBuf = Buffer.from(signature, "utf8");
  if (digest.length !== sigBuf.length) return false;
  try {
    return crypto.timingSafeEqual(digest, sigBuf);
  } catch {
    return false;
  }
}

function mapLemonStatus(lemon: string): string {
  switch (lemon) {
    case "on_trial":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "cancelled":
      return "canceled";
    case "expired":
    case "paused":
      return "inactive";
    default:
      return "inactive";
  }
}

function resolvePeriodEnd(lemonStatus: string, attrs: LemonAttrs): string | null {
  if (lemonStatus === "on_trial" && attrs.trial_ends_at) return attrs.trial_ends_at;
  if (lemonStatus === "cancelled" && attrs.ends_at) return attrs.ends_at;
  if (lemonStatus === "expired" && attrs.ends_at) return attrs.ends_at;
  if (attrs.renews_at) return attrs.renews_at;
  return attrs.ends_at ?? null;
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export async function POST(req: Request) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  const signature = req.headers.get("x-signature");
  const rawBody = await req.text();

  if (!secret) {
    return NextResponse.json({ ok: false, error: "Missing LEMON_SQUEEZY_WEBHOOK_SECRET" }, { status: 500 });
  }

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ ok: false, error: "Missing SUPABASE service credentials" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);
  let event: {
    meta?: { event_name?: string; custom_data?: Record<string, string | undefined> };
    data?: { type?: string; id?: string; attributes?: LemonAttrs };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = event.meta?.event_name ?? "";
  const dataType = event.data?.type;

  if (dataType !== "subscriptions" || !event.data?.attributes) {
    return NextResponse.json({ ok: true, ignored: `No subscription object (${eventName})` });
  }

  const attrs = event.data.attributes;
  const provider_subscription_id = String(event.data.id || "");
  const custom = event.meta?.custom_data ?? {};
  const userIdFromCheckout = custom.user_id?.trim();

  let userId: string | null = null;

  if (userIdFromCheckout && isUuid(userIdFromCheckout)) {
    const { data, error } = await admin.auth.admin.getUserById(userIdFromCheckout);
    if (!error && data.user) userId = data.user.id;
  }

  if (!userId) {
    const customerEmail = attrs.user_email?.trim();
    if (!customerEmail) {
      return NextResponse.json({ ok: true, ignored: "No user_id custom_data and no user_email" });
    }
    const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (usersError) return NextResponse.json({ ok: false, error: usersError.message }, { status: 500 });
    const found = users?.users?.find((u) => u.email?.toLowerCase() === customerEmail.toLowerCase());
    if (!found) return NextResponse.json({ ok: true, ignored: "User not found" });
    userId = found.id;
  }

  const lemonStatus = String(attrs.status || "inactive");
  const dbStatus = mapLemonStatus(lemonStatus);
  const plan = String(custom.plan || "pro");
  const current_period_end = resolvePeriodEnd(lemonStatus, attrs);

  const { error: upsertError } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      provider: "lemon_squeezy",
      provider_customer_id: attrs.customer_id != null ? String(attrs.customer_id) : "",
      provider_subscription_id,
      status: dbStatus,
      plan,
      current_period_end,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  if (upsertError) return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
