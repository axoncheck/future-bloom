import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

function isOpaqueApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createBackendFetch(apiKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isOpaqueApiKey(apiKey) && headers.get("Authorization") === `Bearer ${apiKey}`) {
      headers.delete("Authorization");
    }

    headers.set("apikey", apiKey);
    return fetch(input, { ...init, headers });
  };
}

const backendUrl = import.meta.env.VITE_SUPABASE_URL;
const backendKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!backendUrl || !backendKey) {
  throw new Error("Configuração do backend ausente.");
}

export const supabase = createClient<Database>(backendUrl, backendKey, {
  global: {
    fetch: createBackendFetch(backendKey),
  },
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});