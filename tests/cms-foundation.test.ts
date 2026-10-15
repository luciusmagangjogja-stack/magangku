import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import sharp from "sharp";
import { localCmsSeedPayload } from "../data/cms-seed-payload";
import { localSitePageData } from "../data/site";
import { adminActivitySchema, adminDirectorySchema } from "../lib/cms/admin-schemas";
import { canPerformCmsAction } from "../lib/cms/authorization";
import { getPublicDesignStyle } from "../lib/cms/design-style";
import { inspectImageUpload } from "../lib/cms/image-upload";
import { mapSiteCmsPayload } from "../lib/cms/mapper";
import { resolveSitePageData } from "../lib/cms/resolve-site-data";
import { cmsSectionSchema, siteCmsPayloadSchema, siteImageRowSchema } from "../lib/cms/schemas";

const validPayload = siteCmsPayloadSchema.parse(localCmsSeedPayload);

test("the local seed satisfies the complete CMS contract", () => {
  assert.equal(validPayload.sections.length, 5);
  assert.equal(validPayload.images.length, 7);
  assert.deepEqual(
    validPayload.sections.map((section) => section.section_key),
    ["hero", "requirements", "internship_positions", "facilities", "contact"],
  );
});

test("the seeded content counts match the integration expectations", () => {
  const hero = validPayload.sections.find((entry) => entry.section_key === "hero");
  const requirements = validPayload.sections.find((entry) => entry.section_key === "requirements");
  const positions = validPayload.sections.find((entry) => entry.section_key === "internship_positions");
  const facilities = validPayload.sections.find((entry) => entry.section_key === "facilities");
  const contact = validPayload.sections.find((entry) => entry.section_key === "contact");

  assert.equal(hero?.is_visible, true);
  assert.equal(requirements?.content.items.length, 6);
  assert.equal(positions?.content.items.length, 11);
  assert.equal(facilities?.content.items.length, 5);
  assert.deepEqual(contact?.content, {
    title: "More info",
    phoneNumber: "0818 1818 1013",
    whatsappUrl: "https://wa.link/y23pe4",
    registrationUrl: "http://bit.ly/form_magangku",
    registrationButtonText: "FORM PENDAFTARAN",
    attribution: "powered by www.Republikweb.net",
  });
});

test("image metadata accepts supported MIME types up to 5 MiB and rejects invalid values", () => {
  const image = validPayload.images[0];

  for (const mime_type of ["image/jpeg", "image/png", "image/webp"] as const) {
    assert.equal(siteImageRowSchema.safeParse({ ...image, mime_type, file_size: 5 * 1024 * 1024 }).success, true);
  }

  assert.equal(siteImageRowSchema.safeParse({ ...image, mime_type: "image/gif" }).success, false);
  assert.equal(siteImageRowSchema.safeParse({ ...image, file_size: 5 * 1024 * 1024 + 1 }).success, false);
  assert.equal(siteImageRowSchema.safeParse({ ...image, file_size: 0 }).success, false);
});

test("image upload inspection checks actual JPEG, PNG, and WebP signatures and dimensions", async () => {
  const pixel = sharp({
    create: { width: 1, height: 1, channels: 4, background: { r: 248, g: 146, b: 29, alpha: 1 } },
  });
  const [png, jpeg, webp] = await Promise.all([
    pixel.clone().png().toBuffer(),
    pixel.clone().jpeg().toBuffer(),
    pixel.clone().webp().toBuffer(),
  ]);

  assert.deepEqual(
    await inspectImageUpload(new File([png], "pixel.png", { type: "image/png" })),
    { mimeType: "image/png", extension: "png", width: 1, height: 1, fileSize: png.length },
  );
  assert.equal((await sharp(png).metadata()).width, 1);
  assert.deepEqual(
    await inspectImageUpload(new File([jpeg], "photo.jpg", { type: "image/jpeg" })),
    { mimeType: "image/jpeg", extension: "jpg", width: 1, height: 1, fileSize: jpeg.length },
  );
  assert.equal((await sharp(jpeg).metadata()).height, 1);
  assert.deepEqual(
    await inspectImageUpload(new File([webp], "art.webp", { type: "image/webp" })),
    { mimeType: "image/webp", extension: "webp", width: 1, height: 1, fileSize: webp.length },
  );
  assert.equal((await sharp(webp).metadata()).width, 1);

  const invalid = new File([new Uint8Array([1, 2, 3])], "invalid.png", { type: "image/png" });
  await assert.rejects(inspectImageUpload(invalid), /JPEG, PNG, atau WebP yang valid/);
  await assert.rejects(sharp(Buffer.from([1, 2, 3])).metadata());
  const tooLarge = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" });
  await assert.rejects(inspectImageUpload(tooLarge), /5 MiB/);
});

test("a valid hero record passes runtime validation", () => {
  const section = validPayload.sections.find((entry) => entry.section_key === "hero");
  assert.ok(section);
  assert.equal(cmsSectionSchema.parse(section).section_key, "hero");
});

test("valid requirements and their stable presentation IDs pass runtime validation", () => {
  const section = validPayload.sections.find((entry) => entry.section_key === "requirements");
  assert.ok(section);
  assert.equal(cmsSectionSchema.parse(section).section_key, "requirements");
});

test("valid internship positions with stable IDs pass runtime validation", () => {
  const section = validPayload.sections.find((entry) => entry.section_key === "internship_positions");
  assert.ok(section);
  assert.equal(cmsSectionSchema.parse(section).section_key, "internship_positions");
});

test("valid facilities and their presentation IDs pass runtime validation", () => {
  const section = validPayload.sections.find((entry) => entry.section_key === "facilities");
  assert.ok(section);
  assert.equal(cmsSectionSchema.parse(section).section_key, "facilities");
});

test("a valid contact record passes runtime validation", () => {
  const section = validPayload.sections.find((entry) => entry.section_key === "contact");
  assert.ok(section);
  assert.equal(cmsSectionSchema.parse(section).section_key, "contact");
});

test("mapping sorts visible sections and mixes uploaded and local image URLs", () => {
  const payload = structuredClone(validPayload);
  payload.sections[0].sort_order = 10;
  payload.sections[1].sort_order = 1;
  payload.sections[2].sort_order = 20;
  payload.sections[3].sort_order = 30;
  payload.sections[4].sort_order = 40;
  payload.images[0].storage_path = "public/hero-art.webp";

  const page = mapSiteCmsPayload(payload, "https://magangku.supabase.co");

  assert.deepEqual(page.visibleSections.slice(0, 2), ["requirements", "hero"]);
  assert.equal(
    page.content.hero.image.src,
    "https://magangku.supabase.co/storage/v1/object/public/site-media/public/hero-art.webp",
  );
  assert.equal(page.content.hero.backgroundImage, "/images/bg-soft-magangku.png");
  assert.equal(page.images.find((image) => image.key === "hero_image")?.storagePath, "public/hero-art.webp");
});

test("the runtime contract rejects missing sections, duplicate IDs, and unsafe image paths", () => {
  const missingSection = structuredClone(validPayload);
  missingSection.sections.pop();
  assert.equal(siteCmsPayloadSchema.safeParse(missingSection).success, false);

  const duplicateId = structuredClone(validPayload);
  const requirements = duplicateId.sections.find((section) => section.section_key === "requirements");
  if (!requirements || requirements.section_key !== "requirements") assert.fail("requirements fixture missing");
  requirements.content.items[1].id = requirements.content.items[0].id;
  assert.equal(siteCmsPayloadSchema.safeParse(duplicateId).success, false);

  const unsafeImage = structuredClone(validPayload);
  unsafeImage.images[0].storage_path = "../private/image.webp";
  assert.equal(siteCmsPayloadSchema.safeParse(unsafeImage).success, false);
});

test("malformed database JSON is rejected", () => {
  assert.equal(siteCmsPayloadSchema.safeParse({ settings: [], sections: {}, images: null }).success, false);
});

test("database read failures return the unchanged local page without exposing internals", async () => {
  const logged: Array<{ message: string; detail: Record<string, string> }> = [];
  const log = (message: string, detail: Record<string, string>) => logged.push({ message, detail });

  const failedRead = await resolveSitePageData(
    async () => {
      throw new Error("private connection detail");
    },
    localSitePageData,
    "https://magangku.supabase.co",
    log,
  );
  assert.equal(failedRead, localSitePageData);
  assert.deepEqual(logged[0].detail, { source: "supabase", code: "Error" });
  assert.equal(JSON.stringify(logged).includes("private connection detail"), false);
});

test("invalid remote data returns the local page and logs a sanitized validation summary", async () => {
  const logged: Array<{ message: string; detail: Record<string, string> }> = [];
  const invalidRead = await resolveSitePageData(
    async () => ({ unexpected: "payload" }),
    localSitePageData,
    "https://magangku.supabase.co",
    (message, detail) => logged.push({ message, detail }),
  );
  assert.equal(invalidRead, localSitePageData);
  assert.equal(logged.length, 1);
  assert.equal(logged[0].message.includes("invalid"), true);
  assert.equal("stack" in logged[0].detail, false);
});

test("unauthenticated, mismatched, and inactive users are denied CMS access", () => {
  const editor = { user_id: "editor-1", role: "editor", is_active: true } as const;
  const inactive = { ...editor, is_active: false };

  assert.equal(canPerformCmsAction(null, null, "edit_content"), false);
  assert.equal(canPerformCmsAction(editor, "another-user", "edit_content"), false);
  assert.equal(canPerformCmsAction(inactive, "editor-1", "edit_content"), false);
});

test("editor and owner roles receive only their intended CMS capabilities", () => {
  const owner = { user_id: "owner-1", role: "owner", is_active: true } as const;
  const editor = { user_id: "editor-1", role: "editor", is_active: true } as const;

  assert.equal(canPerformCmsAction(owner, "owner-1", "manage_admins"), true);
  assert.equal(canPerformCmsAction(editor, "editor-1", "edit_content"), true);
  assert.equal(canPerformCmsAction(editor, "editor-1", "edit_design"), true);
  assert.equal(canPerformCmsAction(editor, "editor-1", "manage_images"), true);
  assert.equal(canPerformCmsAction(editor, "editor-1", "manage_admins"), false);
});

test("public design tokens map to bounded CSS variables without raw CSS", () => {
  const style = getPublicDesignStyle({
    ...validPayload.settings.design_tokens,
    colors: { ...validPayload.settings.design_tokens.colors, primary: "#123456" },
    layout: { ...validPayload.settings.design_tokens.layout, contentWidth: 1200 },
  });
  const styleValues = style as Record<string, unknown>;
  assert.equal(styleValues["--color-primary"], "#123456");
  assert.equal(styleValues["--content-width"], "1200px");
  assert.equal(styleValues["--font-body"], '"Hey Comic", "Comic Sans MS", cursive');
  assert.equal("--responsive-breakpoint" in styleValues, false);
});

test("migration declares RLS, owner-only profile management, and no public writes", async () => {
  const sql = await readFile(
    new URL("../supabase/migrations/20260929000100_create_cms_foundation.sql", import.meta.url),
    "utf8",
  );

  for (const table of ["site_settings", "site_sections", "site_images", "admin_profiles", "activity_logs"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(sql, /admin_profiles_owner_insert[\s\S]*?has_site_role\(array\['owner'\]/i);
  assert.match(sql, /site_media_admin_upload[\s\S]*?has_site_role\(array\['owner', 'editor'\]/i);
  assert.match(sql, /site_media_admin_delete[\s\S]*?has_site_role\(array\['owner', 'editor'\]/i);
  assert.doesNotMatch(sql, /create policy site_media_admin_update/i);
  assert.match(sql, /revoke all on table[\s\S]*?from anon, authenticated/i);
  assert.doesNotMatch(sql, /grant\s+(?:insert|update|delete|all)\s+on\s+table\s+public\.[^;]+\s+to\s+anon/i);
});

test("admin directory access is limited to authenticated owners", async () => {
  const sql = await readFile(
    new URL("../supabase/migrations/20260929000200_admin_directory.sql", import.meta.url),
    "utf8",
  );

  assert.match(sql, /security definer[\s\S]*?set search_path = ''/i);
  assert.match(sql, /join auth\.users[\s\S]*?has_site_role\(array\['owner'\]/i);
  assert.match(sql, /revoke all on function public\.list_site_admins\(\) from public, anon/i);
  assert.match(sql, /grant execute on function public\.list_site_admins\(\) to authenticated/i);
  assert.match(sql, /function public\.get_site_activity\(\)[\s\S]*?has_site_role\(array\['owner', 'editor'\]/i);
  assert.match(sql, /revoke all on function public\.get_site_activity\(\) from public, anon/i);
  assert.match(sql, /grant execute on function public\.get_site_activity\(\) to authenticated/i);
  assert.match(sql, /record_site_auth_event\(p_action text\)[\s\S]*?current_actor uuid := \(select auth\.uid\(\)\)/i);
  assert.match(sql, /p_action not in \('LOGIN', 'LOGOUT'\)/i);
  assert.match(sql, /revoke all on function public\.record_site_auth_event\(text\) from public, anon/i);
  const foundation = await readFile(
    new URL("../supabase/migrations/20260929000100_create_cms_foundation.sql", import.meta.url),
    "utf8",
  );
  assert.match(foundation, /admin_profiles_keep_active_owner[\s\S]*?prevent_last_active_owner_removal/i);
});

test("admin routes and all writes recheck profile authorization server-side", async () => {
  const [layout, actions, auth, authActions, pageClient] = await Promise.all([
    readFile(new URL("../app/admin/(workspace)/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/actions.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/cms/auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/auth-actions.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/supabase/admin-page-client.ts", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /getCurrentCmsAdmin\(\)[\s\S]*?if \(!admin\) redirect/);
  assert.match(actions, /requireCmsPermission\(permission\)/);
  assert.match(actions, /cmsSectionSchema\.safeParse/);
  assert.match(actions, /designTokensSchema\.safeParse/);
  assert.match(actions, /decodeImageUpload\(new File\(/);
  assert.match(actions, /storage\.from\("site-media"\)\.download\(storage_path\)/);
  assert.match(auth, /auth\.getClaims\(\)/);
  assert.match(auth, /\.from\("admin_profiles"\)/);
  assert.doesNotMatch(auth, /user_metadata/);
  assert.match(authActions, /rpc\("record_site_auth_event", \{ p_action: "LOGIN" \}\)/);
  assert.match(authActions, /rpc\("record_site_auth_event", \{ p_action: "LOGOUT" \}\)/);
  assert.match(pageClient, /if \(!isSupabaseConfigured\(\)\) return null/);
});

test("admin directory and activity RPC rows validate before display", () => {
  assert.equal(adminDirectorySchema.safeParse([{
    user_id: "11111111-1111-4111-8111-111111111111",
    email: "owner@example.test",
    role: "owner",
    is_active: true,
    created_at: "2026-09-29T12:00:00.000Z",
  }]).success, true);
  assert.equal(adminDirectorySchema.safeParse([{
    user_id: "not-a-uuid",
    email: null,
    role: "owner",
    is_active: true,
    created_at: "2026-09-29T12:00:00.000Z",
  }]).success, false);
  assert.equal(adminActivitySchema.safeParse([{
    id: "22222222-2222-4222-8222-222222222222",
    actor_email: null,
    action: "UPDATE",
    entity_type: "site_sections",
    entity_id: "hero",
    before_data: { content: {} },
    after_data: { content: {} },
    created_at: "2026-09-29T12:00:00.000Z",
  }]).success, true);
});
