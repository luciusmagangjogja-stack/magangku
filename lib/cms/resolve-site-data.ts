import { siteCmsPayloadSchema } from "./schemas";
import { mapSiteCmsPayload } from "./mapper";
import type { SitePageData } from "./types";

export type CmsErrorLogger = (message: string, detail: Record<string, string>) => void;

function issueSummary(issues: readonly { path: PropertyKey[]; code: string }[]) {
  return issues
    .slice(0, 8)
    .map((issue) => `${issue.path.map(String).join(".") || "payload"}:${issue.code}`)
    .join(", ");
}

export async function resolveSitePageData(
  readRemote: () => Promise<unknown>,
  fallback: SitePageData,
  supabaseUrl: string,
  logError: CmsErrorLogger = (message, detail) => console.error(message, detail),
): Promise<SitePageData> {
  let raw: unknown;
  try {
    raw = await readRemote();
  } catch (error) {
    const code = error instanceof Error ? error.name : "UnknownError";
    logError("[cms] Supabase read failed; serving local content.", { source: "supabase", code });
    return fallback;
  }

  const parsed = siteCmsPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    logError("[cms] Supabase payload is invalid; serving local content.", {
      source: "supabase",
      issues: issueSummary(parsed.error.issues),
    });
    return fallback;
  }

  try {
    return mapSiteCmsPayload(parsed.data, supabaseUrl);
  } catch (error) {
    const code = error instanceof Error ? error.name : "UnknownError";
    logError("[cms] Supabase content could not be mapped; serving local content.", {
      source: "supabase",
      code,
    });
    return fallback;
  }
}
