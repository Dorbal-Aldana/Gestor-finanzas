// Placeholder para tipos generados de Supabase.
// Más adelante puedes pegar aquí los tipos generados con:
// npx supabase gen types typescript --project-id "tu-project-id" --schema public > lib/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

