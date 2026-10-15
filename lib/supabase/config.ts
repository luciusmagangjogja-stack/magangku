export interface SupabaseEnvironment {
  url: string;
  publishableKey: string;
}

export function getSupabaseEnvironment(): SupabaseEnvironment | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

  if (!url && !publishableKey) return null;
  if (!url || !publishableKey) {
    throw new Error("Both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required.");
  }

  const parsedUrl = new URL(url);
  if (!(["http:", "https:"].includes(parsedUrl.protocol)) || parsedUrl.pathname !== "/") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be an HTTP(S) project URL without a path.");
  }

  return { url: parsedUrl.origin, publishableKey };
}

export function isSupabaseConfigured() {
  try {
    return getSupabaseEnvironment() !== null;
  } catch {
    return false;
  }
}
