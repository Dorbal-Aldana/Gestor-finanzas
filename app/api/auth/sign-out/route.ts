import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  
  const { error } = await supabase.auth.signOut();

  if (error) {
    // Retornamos un status 500 si algo falló en el servidor
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  // Si la petición viene de un fetch (cliente), respondemos con 200 OK
  if (request.headers.get("Accept")?.includes("application/json")) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // Si viene de un formulario tradicional, redireccionamos a la raíz de forma relativa
  return NextResponse.redirect(new URL("/", request.url), { status: 302 });
}