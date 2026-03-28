import Link from "next/link";
import { LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-4 px-4 py-2.5">
          <Link
            href="/"
            className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-300"
          >
            Portada
          </Link>
          <form action="/api/auth/sign-out" method="POST">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-rose-800/70 hover:bg-rose-950/35 hover:text-rose-100"
            >
              <LogOut className="h-3.5 w-3.5 opacity-90" aria-hidden />
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      {children}
    </>
  );
}
