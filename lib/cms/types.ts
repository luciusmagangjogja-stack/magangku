export const siteSectionKeys = [
  "hero",
  "requirements",
  "internship_positions",
  "facilities",
  "contact",
] as const;

export type SiteSectionKey = (typeof siteSectionKeys)[number];

export const siteImageKeys = [
  "hero_image",
  "hero_background",
  "people_banner",
  "facilities_illustration",
  "contact_background",
  "registration_image",
  "badge_image",
] as const;

export type SiteImageKey = (typeof siteImageKeys)[number];
export type RequirementIcon = "wifi" | "document" | "mail" | "sparkles" | "book" | "shield";
export type ItemTone = "green" | "orange";
export type FacilityGroup = "left" | "right" | "center";

export interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
  };
  typography: {
    fontFamily: "hey-comic" | "system-sans";
    baseSize: number;
    headingSize: number;
    paragraphSize: number;
    lineHeight: number;
  };
  layout: {
    contentWidth: number;
    sectionPadding: number;
    elementSpacing: number;
  };
  shape: {
    borderRadius: number;
    buttonRadius: number;
    cardRadius: number;
  };
}

export interface SiteSettings {
  siteTitle: string;
  seoDescription: string;
  designTokens: DesignTokens;
}

export interface HeroContent {
  titleLines: readonly string[];
  paragraphs: readonly string[];
  image: { src: string; alt: string };
  backgroundImage: string;
  peopleBannerImage: string;
}

export interface RequirementsContent {
  title: string;
  items: readonly {
    id: string;
    text: string;
    icon: RequirementIcon;
    tone: ItemTone;
  }[];
}

export interface ListSectionContent {
  title: string;
  items: readonly { id: string; name: string }[];
}

export interface FacilitiesContent {
  title: string;
  items: readonly {
    id: string;
    text: string;
    tone: ItemTone;
    group: FacilityGroup;
  }[];
  backgroundImage: string;
}

export interface ContactContent {
  title: string;
  phoneNumber: string;
  whatsappUrl: string;
  registrationUrl: string;
  registrationButtonText: string;
  registrationImage: { src: string; alt: string };
  attribution: string;
  badgeImage: { src: string; alt: string };
  backgroundImage: string;
}

export interface SiteContent {
  hero: HeroContent;
  requirements: RequirementsContent;
  positions: ListSectionContent;
  facilities: FacilitiesContent;
  contact: ContactContent;
}

export interface LocalSiteImage {
  label: string;
  localFallbackPath: string;
  altText: string;
  mimeType: "image/png";
  fileSize: number;
  width: number;
  height: number;
}

export interface SitePageData {
  settings: SiteSettings;
  content: SiteContent;
  visibleSections: readonly SiteSectionKey[];
  images: readonly SiteImageInfo[];
}

export interface SiteImageInfo {
  key: SiteImageKey;
  label: string;
  src: string;
  storagePath: string | null;
  localFallbackPath: string;
  altText: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
}

export type AdminRole = "owner" | "editor";
export type CmsPermission = "edit_content" | "edit_design" | "manage_images" | "manage_admins";
