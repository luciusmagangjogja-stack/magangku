import type { CmsImageRow, CmsSection, SiteCmsPayload } from "./schemas";
import type { SiteContent, SiteImageKey, SitePageData, SiteSectionKey } from "./types";

function getImage(
  images: Map<SiteImageKey, CmsImageRow>,
  key: SiteImageKey,
  supabaseUrl: string | null,
) {
  const image = images.get(key);
  if (!image) throw new Error(`Required public image slot is missing: ${key}`);

  let src = image.local_fallback_path;
  if (image.storage_path && supabaseUrl) {
    const path = image.storage_path.split("/").map(encodeURIComponent).join("/");
    src = new URL(`/storage/v1/object/public/site-media/${path}`, supabaseUrl).toString();
  }

  return { src, alt: image.alt_text };
}

function section<Key extends SiteSectionKey>(payload: SiteCmsPayload, key: Key) {
  const row = payload.sections.find((entry) => entry.section_key === key);
  if (!row) throw new Error(`Required CMS section is missing: ${key}`);
  return row as Extract<CmsSection, { section_key: Key }>;
}

export function mapSiteCmsPayload(payload: SiteCmsPayload, supabaseUrl: string | null): SitePageData {
  const images = new Map(payload.images.map((image) => [image.image_key, image]));
  const hero = section(payload, "hero");
  const requirements = section(payload, "requirements");
  const positions = section(payload, "internship_positions");
  const facilities = section(payload, "facilities");
  const contact = section(payload, "contact");
  const requirementPresentation = new Map(requirements.presentation.items.map((item) => [item.id, item]));
  const facilityPresentation = new Map(facilities.presentation.items.map((item) => [item.id, item]));

  const content: SiteContent = {
    hero: {
      ...hero.content,
      image: getImage(images, hero.presentation.imageKey, supabaseUrl),
      backgroundImage: getImage(images, hero.presentation.backgroundImageKey, supabaseUrl).src,
      peopleBannerImage: getImage(images, hero.presentation.peopleBannerImageKey, supabaseUrl).src,
    },
    requirements: {
      ...requirements.content,
      items: requirements.content.items.map((item) => ({
        ...item,
        ...requirementPresentation.get(item.id)!,
      })),
    },
    positions: positions.content,
    facilities: {
      ...facilities.content,
      items: facilities.content.items.map((item) => ({
        ...item,
        ...facilityPresentation.get(item.id)!,
      })),
      backgroundImage: getImage(images, facilities.presentation.backgroundImageKey, supabaseUrl).src,
    },
    contact: {
      ...contact.content,
      registrationImage: getImage(images, contact.presentation.registrationImageKey, supabaseUrl),
      badgeImage: getImage(images, contact.presentation.badgeImageKey, supabaseUrl),
      backgroundImage: getImage(images, contact.presentation.backgroundImageKey, supabaseUrl).src,
    },
  };

  return {
    settings: {
      siteTitle: payload.settings.site_title,
      seoDescription: payload.settings.seo_description,
      designTokens: payload.settings.design_tokens,
    },
    content,
    visibleSections: payload.sections
      .filter((entry) => entry.is_visible)
      .sort((first, second) => first.sort_order - second.sort_order)
      .map((entry) => entry.section_key),
    images: payload.images.map((image) => ({
      key: image.image_key,
      label: image.label,
      src: getImage(images, image.image_key, supabaseUrl).src,
      storagePath: image.storage_path,
      localFallbackPath: image.local_fallback_path,
      altText: image.alt_text,
      mimeType: image.mime_type,
      fileSize: image.file_size,
      width: image.width,
      height: image.height,
    })),
  };
}
