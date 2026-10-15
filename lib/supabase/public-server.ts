import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnvironment } from "./config";

export function createSupabasePublicServerClient() {
  const config = getSupabaseEnvironment();
  if (!config) throw new Error("Supabase is not configured.");

  return createClient(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: init?.signal ?? AbortSignal.timeout(5000),
        }),
    },
  });
}
