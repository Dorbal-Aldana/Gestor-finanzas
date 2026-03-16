"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

export default function SignUpPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-xl">
        <h1 className="text-xl font-semibold tracking-tight">Crear cuenta</h1>
        <p className="mt-1 text-sm text-slate-400">Empieza a registrar tus finanzas hoy.</p>

        {done ? (
          <div className="mt-6 rounded-2xl border border-emerald-900/50 bg-emerald-950/30 p-4 text-sm text-emerald-100">
            Cuenta creada. Si tu proyecto de Supabase tiene confirmación de email activada, revisa tu correo para
            confirmar.
            <div className="mt-3">
              <Link className="text-slate-100 hover:underline" href="/sign-in">
                Ir a iniciar sesión
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-xs text-slate-300">Nombre completo</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                type="text"
                placeholder="Dr. Juan Pérez"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300">Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300">Contraseña</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                minLength={8}
                placeholder="mínimo 8 caracteres"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
                {error}
              </div>
            ) : null}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? "Creando..." : "Crear cuenta"}
            </button>
          </form>
        )}

        <p className="mt-4 text-xs text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link className="text-slate-200 hover:underline" href="/sign-in">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}

