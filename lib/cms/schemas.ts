import { z } from "zod";
import { siteImageKeys, siteSectionKeys } from "./types";

const text = z.string().min(1).max(2000);
const itemId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const imageKey = z.enum(siteImageKeys);

export const designTokensSchema = z
  .object({
    colors: z
      .object({
        primary: color,
        secondary: color,
        accent: color,
        background: color,
        surface: color,
        text: color,
        muted: color,
        border: color,
      })
      .strict(),
    typography: z
      .object({
        fontFamily: z.enum(["hey-comic", "system-sans"]),
        baseSize: z.number().int().min(12).max(24),
        headingSize: z.number().int().min(24).max(56),
        paragraphSize: z.number().int().min(12).max(24),
        lineHeight: z.number().min(1).max(2),
      })
      .strict(),
    layout: z
      .object({
        contentWidth: z.number().int().min(640).max(1440),
        sectionPadding: z.number().int().min(0).max(200),
        elementSpacing: z.number().int().min(0).max(80),
      })
      .strict(),
    shape: z
      .object({
        borderRadius: z.number().int().min(0).max(32),
        buttonRadius: z.number().int().min(0).max(32),
        cardRadius: z.number().int().min(0).max(32),
      })
      .strict(),
  })
  .strict();

export const siteSettingsRowSchema = z
  .object({
    site_title: z.string().min(1).max(120),
    seo_description: z.string().min(1).max(320),
    design_tokens: designTokensSchema,
  })
  .strict();

const heroSectionSchema = z
  .object({
    section_key: z.literal("hero"),
    is_visible: z.literal(true),
    sort_order: z.number().int().min(0).max(1000),
    content: z
      .object({
        titleLines: z.array(text.max(120)).min(1).max(3),
        paragraphs: z.array(text.max(1000)).min(1).max(5),
      })
      .strict(),
    presentation: z
      .object({
        imageKey: imageKey,
        backgroundImageKey: imageKey,
        peopleBannerImageKey: imageKey,
      })
      .strict(),
  })
  .strict();

const requirementsSectionSchema = z
  .object({
    section_key: z.literal("requirements"),
    is_visible: z.boolean(),
    sort_order: z.number().int().min(0).max(1000),
    content: z
      .object({
        title: text.max(120),
        items: z.array(z.object({ id: itemId, text }).strict()).min(1).max(50),
      })
      .strict(),
    presentation: z
      .object({
        items: z
          .array(
            z
              .object({
                id: itemId,
                icon: z.enum(["wifi", "document", "mail", "sparkles", "book", "shield"]),
                tone: z.enum(["green", "orange"]),
              })
              .strict(),
          )
          .min(1)
          .max(50),
      })
      .strict(),
  })
  .strict();

const positionsSectionSchema = z
  .object({
    section_key: z.literal("internship_positions"),
    is_visible: z.boolean(),
    sort_order: z.number().int().min(0).max(1000),
    content: z
      .object({
        title: text.max(120),
        items: z.array(z.object({ id: itemId, name: text.max(120) }).strict()).min(1).max(100),
      })
      .strict(),
    presentation: z.object({}).strict(),
  })
  .strict();

const facilitiesSectionSchema = z
  .object({
    section_key: z.literal("facilities"),
    is_visible: z.boolean(),
    sort_order: z.number().int().min(0).max(1000),
    content: z
      .object({
        title: text.max(120),
        items: z.array(z.object({ id: itemId, text }).strict()).min(1).max(50),
      })
      .strict(),
    presentation: z
      .object({
        backgroundImageKey: imageKey,
        items: z
          .array(
            z
              .object({
                id: itemId,
                tone: z.enum(["green", "orange"]),
                group: z.enum(["left", "right", "center"]),
              })
              .strict(),
          )
          .min(1)
          .max(50),
      })
      .strict(),
  })
  .strict();

const safeUrl = z
  .string()
  .url()
  .refine((value) => ["http:", "https:"].includes(new URL(value).protocol));

const contactSectionSchema = z
  .object({
    section_key: z.literal("contact"),
    is_visible: z.literal(true),
    sort_order: z.number().int().min(0).max(1000),
    content: z
      .object({
        title: text.max(120),
        phoneNumber: z.string().regex(/^\+?[\d\s()-]{7,32}$/),
        whatsappUrl: safeUrl,
        registrationUrl: safeUrl,
        registrationButtonText: text.max(80),
        attribution: text.max(160),
      })
      .strict(),
    presentation: z
      .object({
        backgroundImageKey: imageKey,
        registrationImageKey: imageKey,
        badgeImageKey: imageKey,
      })
      .strict(),
  })
  .strict();

export const cmsSectionSchema = z.discriminatedUnion("section_key", [
  heroSectionSchema,
  requirementsSectionSchema,
  positionsSectionSchema,
  facilitiesSectionSchema,
  contactSectionSchema,
]);

export const cmsSectionsSchema = z
  .array(cmsSectionSchema)
  .length(siteSectionKeys.length)
  .superRefine((sections, context) => {
    const keys = sections.map((section) => section.section_key);
    if (new Set(keys).size !== siteSectionKeys.length) {
      context.addIssue({ code: "custom", message: "Section keys must be unique." });
    }
    if (siteSectionKeys.some((key) => !keys.includes(key))) {
      context.addIssue({ code: "custom", message: "All five public sections are required." });
    }

    const requirements = sections.find((section) => section.section_key === "requirements");
    if (requirements && requirements.section_key === "requirements") {
      const contentIds = requirements.content.items.map((item) => item.id);
      const presentationIds = requirements.presentation.items.map((item) => item.id);
      if (
        new Set(contentIds).size !== contentIds.length ||
        new Set(presentationIds).size !== presentationIds.length ||
        contentIds.length !== presentationIds.length ||
        contentIds.some((id) => !presentationIds.includes(id))
      ) {
        context.addIssue({ code: "custom", message: "Requirement presentation IDs must match content IDs." });
      }
    }

    const facilities = sections.find((section) => section.section_key === "facilities");
    if (facilities && facilities.section_key === "facilities") {
      const contentIds = facilities.content.items.map((item) => item.id);
      const presentationIds = facilities.presentation.items.map((item) => item.id);
      if (
        new Set(contentIds).size !== contentIds.length ||
        new Set(presentationIds).size !== presentationIds.length ||
        contentIds.length !== presentationIds.length ||
        contentIds.some((id) => !presentationIds.includes(id))
      ) {
        context.addIssue({ code: "custom", message: "Facility presentation IDs must match content IDs." });
      }
    }
  });

const localPath = z
  .string()
  .regex(/^\/images\/[a-zA-Z0-9._/-]+$/)
  .refine((value) => !value.includes(".."));
const storagePath = z
  .string()
  .min(1)
  .max(500)
  .regex(/^(?!\/)(?!.*\.\.)[a-zA-Z0-9._/-]+\.(?:jpe?g|png|webp)$/i);

export const siteImageRowSchema = z
  .object({
    image_key: imageKey,
    label: z.string().min(1).max(120),
    storage_path: storagePath.nullable(),
    local_fallback_path: localPath,
    alt_text: z.string().max(500),
    mime_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
    file_size: z.number().int().positive().max(5 * 1024 * 1024),
    width: z.number().int().positive().max(12000),
    height: z.number().int().positive().max(12000),
  })
  .strict();

export const siteCmsPayloadSchema = z
  .object({
    settings: siteSettingsRowSchema,
    sections: cmsSectionsSchema,
    images: z.array(siteImageRowSchema).length(siteImageKeys.length),
  })
  .strict()
  .superRefine((payload, context) => {
    const imageKeys = payload.images.map((image) => image.image_key);
    if (new Set(imageKeys).size !== siteImageKeys.length || siteImageKeys.some((key) => !imageKeys.includes(key))) {
      context.addIssue({ code: "custom", message: "All seven public image slots are required exactly once." });
    }
  });

export const adminProfileSchema = z
  .object({
    user_id: z.string().uuid(),
    role: z.enum(["owner", "editor"]),
    is_active: z.boolean(),
  })
  .strict();

export type SiteCmsPayload = z.infer<typeof siteCmsPayloadSchema>;
export type CmsSection = z.infer<typeof cmsSectionSchema>;
export type CmsImageRow = z.infer<typeof siteImageRowSchema>;
export type AdminProfile = z.infer<typeof adminProfileSchema>;
