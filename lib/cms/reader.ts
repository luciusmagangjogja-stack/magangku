import "server-only";

import { cache } from "react";
import { localSitePageData } from "@/data/site";
import { resolveSitePageData } from "@/lib/cms/resolve-site-data";
import { createSupabasePublicServerClient } from "@/lib/supabase/public-server";
import { getSupabaseEnvironment } from "@/lib/supabase/config";
import type { SitePageData } from "@/lib/cms/types";

async function readCmsPayload() {
  const supabase = createSupabasePublicServerClient();
  const [settingsResult, sectionsResult, imagesResult] = await Promise.all([
    supabase
      .from("site_settings")
      .select("site_title, seo_description, design_tokens")
      .limit(1)
      .single(),
    supabase
      .from("site_sections")
      .select("section_key, is_visible, sort_order, content, presentation")
      .order("sort_order", { ascending: true }),
    supabase
      .from("site_images")
      .select("image_key, label, storage_path, local_fallback_path, alt_text, mime_type, file_size, width, height"),
  ]);

  for (const [table, result] of [
    ["site_settings", settingsResult],
    ["site_sections", sectionsResult],
    ["site_images", imagesResult],
  ] as const) {
    if (result.error) {
      throw new Error(`Supabase query failed for ${table} (${result.error.code ?? "unknown"}).`);
    }
  }

  return {
    settings: settingsResult.data,
    sections: sectionsResult.data,
    images: imagesResult.data,
  };
}

const loadSitePageData = cache(async (): Promise<SitePageData> => {
  let config;
  try {
    config = getSupabaseEnvironment();
  } catch (error) {
    const code = error instanceof Error ? error.name : "UnknownError";
    console.error("[cms] Supabase configuration is invalid; serving local content.", { code });
    return localSitePageData;
  }

  if (!config) return localSitePageData;

  return resolveSitePageData(readCmsPayload, localSitePageData, config.url);
});

export async function getSiteContent() {
  return loadSitePageData();
}

export async function getSiteSettings() {
  return (await loadSitePageData()).settings;
}

export async function getSiteSections() {
  return (await loadSitePageData()).visibleSections;
}

export async function getSiteImages() {
  return (await loadSitePageData()).images;
}
