/**
 * Checkout de Lemon Squeezy con custom data para webhooks.
 * @see https://docs.lemonsqueezy.com/help/checkout/passing-custom-data
 */
export function buildLemonCheckoutUrl(params: {
  checkoutBaseUrl: string;
  userId: string;
  email?: string | null;
  plan?: string;
}): string {
  const u = new URL(params.checkoutBaseUrl.trim());
  const email = params.email?.trim();
  if (email) {
    u.searchParams.set("checkout[email]", email);
  }
  u.searchParams.set("checkout[custom][user_id]", params.userId);
  u.searchParams.set("checkout[custom][plan]", params.plan ?? "pro");
  return u.toString();
}
