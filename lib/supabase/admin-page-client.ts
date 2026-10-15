import "server-only";

import { isSupabaseConfigured } from "./config";
import { createSupabaseServerClient } from "./server";

export async function createAdminPageClient() {
  if (!isSupabaseConfigured()) return null;

  try {
    return await createSupabaseServerClient();
  } catch (error) {
    console.error("[admin] Supabase page client could not be created.", {
      code: error instanceof Error ? error.name : "UnknownError",
    });
    return null;
  }
}