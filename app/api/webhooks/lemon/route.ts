import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function verifySignature(payload: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload, "utf8");
  const digest = hmac.digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
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
  const event = JSON.parse(rawBody);

  // Estrategia MVP:
  // - Lemon envía customer_email; buscamos el usuario por email en auth.users.
  // - Actualizamos public.subscriptions para ese user_id.
  const customerEmail: string | undefined = event?.data?.attributes?.user_email || event?.data?.attributes?.customer_email;
  if (!customerEmail) {
    return NextResponse.json({ ok: true, ignored: "No customer email" });
  }

  const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (usersError) return NextResponse.json({ ok: false, error: usersError.message }, { status: 500 });

  const user = users?.users?.find((u) => u.email?.toLowerCase() === customerEmail.toLowerCase());
  if (!user) return NextResponse.json({ ok: true, ignored: "User not found" });

  const provider_subscription_id = String(event?.data?.id || "");
  const status = String(event?.data?.attributes?.status || "inactive");
  const plan = String(event?.meta?.custom_data?.plan || "pro");

  const { error: upsertError } = await admin.from("subscriptions").upsert(
    {
      user_id: user.id,
      provider: "lemon_squeezy",
      provider_customer_id: String(event?.data?.attributes?.customer_id || ""),
      provider_subscription_id,
      status: status === "active" ? "active" : status,
      plan
    },
    { onConflict: "user_id" }
  );

  if (upsertError) return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

