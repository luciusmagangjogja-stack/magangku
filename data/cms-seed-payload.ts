import { localSiteImages, siteContent, siteSettings } from "./site";
import { siteImageKeys } from "../lib/cms/types";

const requirementPresentation = siteContent.requirements.items.map(({ id, icon, tone }) => ({ id, icon, tone }));
const facilityPresentation = siteContent.facilities.items.map(({ id, tone, group }) => ({ id, tone, group }));

export const localCmsSeedPayload = {
  settings: {
    site_title: siteSettings.siteTitle,
    seo_description: siteSettings.seoDescription,
    design_tokens: siteSettings.designTokens,
  },
  sections: [
    {
      section_key: "hero",
      is_visible: true,
      sort_order: 0,
      content: {
        titleLines: siteContent.hero.titleLines,
        paragraphs: siteContent.hero.paragraphs,
      },
      presentation: {
        imageKey: "hero_image",
        backgroundImageKey: "hero_background",
        peopleBannerImageKey: "people_banner",
      },
    },
    {
      section_key: "requirements",
      is_visible: true,
      sort_order: 1,
      content: {
        title: siteContent.requirements.title,
        items: siteContent.requirements.items.map(({ id, text }) => ({ id, text })),
      },
      presentation: { items: requirementPresentation },
    },
    {
      section_key: "internship_positions",
      is_visible: true,
      sort_order: 2,
      content: {
        title: siteContent.positions.title,
        items: siteContent.positions.items,
      },
      presentation: {},
    },
    {
      section_key: "facilities",
      is_visible: true,
      sort_order: 3,
      content: {
        title: siteContent.facilities.title,
        items: siteContent.facilities.items.map(({ id, text }) => ({ id, text })),
      },
      presentation: {
        backgroundImageKey: "facilities_illustration",
        items: facilityPresentation,
      },
    },
    {
      section_key: "contact",
      is_visible: true,
      sort_order: 4,
      content: {
        title: siteContent.contact.title,
        phoneNumber: siteContent.contact.phoneNumber,
        whatsappUrl: siteContent.contact.whatsappUrl,
        registrationUrl: siteContent.contact.registrationUrl,
        registrationButtonText: siteContent.contact.registrationButtonText,
        attribution: siteContent.contact.attribution,
      },
      presentation: {
        backgroundImageKey: "contact_background",
        registrationImageKey: "registration_image",
        badgeImageKey: "badge_image",
      },
    },
  ],
  images: siteImageKeys.map((imageKey) => {
    const image = localSiteImages[imageKey];
    return {
      image_key: imageKey,
      label: image.label,
      storage_path: null,
      local_fallback_path: image.localFallbackPath,
      alt_text: image.altText,
      mime_type: image.mimeType,
      file_size: image.fileSize,
      width: image.width,
      height: image.height,
    };
  }),
};
