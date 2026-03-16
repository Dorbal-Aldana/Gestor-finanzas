import "./../tailwind.css";
import type { ReactNode } from "react";
import { PostHogProvider } from "../components/posthog-provider";

export const metadata = {
  title: "Gestor de Finanzas",
  description: "Controla tus finanzas personales con IA"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <PostHogProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
            {children}
          </div>
        </PostHogProvider>
      </body>
    </html>
  );
}

