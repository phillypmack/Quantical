// O import do tipo é apagado na compilação; o SDK só entra no bundle pelo
// import() dinâmico abaixo. Antes, `import { createClient }` no topo colocava
// ~40 KB gzip de auth/realtime/postgrest em TODA página — inclusive na landing
// e mesmo quando o Supabase não estava configurado.
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let pending: Promise<SupabaseClient | null> | null = null;

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getSupabaseBrowserClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;
  if (browserClient) return browserClient;

  pending ??= import("@supabase/supabase-js").then(({ createClient }) => {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
    );
    return browserClient;
  });

  return pending;
}
