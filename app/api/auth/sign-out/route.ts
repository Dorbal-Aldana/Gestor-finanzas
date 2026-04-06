import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Cerrar sesión en un Route Handler: las cookies deben escribirse en el mismo
 * NextResponse que se devuelve (redirect). Si solo se usa cookies() de next/headers,
 * en producción el Set-Cookie no siempre acompaña al redirect y la sesión no se borra.
 */
export async function POST(request: NextRequest) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin;
  const response = NextResponse.redirect(new URL("/", baseUrl));

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
          });
        }
      }
    }
  );

  await supabase.auth.signOut();
  return response;
}
