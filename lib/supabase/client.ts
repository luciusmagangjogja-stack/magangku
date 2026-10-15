"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnvironment } from "./config";

export function createSupabaseBrowserClient() {
  const config = getSupabaseEnvironment();
  if (!config) throw new Error("Supabase is not configured.");

  return createBrowserClient(config.url, config.publishableKey);
}
