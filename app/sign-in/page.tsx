import { SignInForm } from "./sign-in-form";

function safeRedirectTo(raw: string | string[] | undefined): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v === "string" && v.startsWith("/") && !v.startsWith("//")) {
    return v;
  }
  return "/dashboard";
}

export default function SignInPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const redirectTo = safeRedirectTo(searchParams.redirectTo);
  return <SignInForm redirectTo={redirectTo} />;
}
