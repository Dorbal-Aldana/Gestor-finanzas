import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components: set cookies puede fallar en RSC.
            // Middleware maneja la escritura normalmente.
          }
        }
      }
    }
  );
}

