import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { test } from "node:test";
import sharp from "sharp";
import { mapSiteCmsPayload } from "../lib/cms/mapper";
import { siteCmsPayloadSchema } from "../lib/cms/schemas";

loadEnvConfig(process.cwd());

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const editorEmail = process.env.SUPABASE_TEST_EDITOR_EMAIL ?? "";
const editorPassword = process.env.SUPABASE_TEST_EDITOR_PASSWORD ?? "";
const ownerEmail = process.env.SUPABASE_TEST_OWNER_EMAIL ?? "";
const ownerPassword = process.env.SUPABASE_TEST_OWNER_PASSWORD ?? "";
const nonAdminEmail = process.env.SUPABASE_TEST_NONADMIN_EMAIL ?? "";
const nonAdminPassword = process.env.SUPABASE_TEST_NONADMIN_PASSWORD ?? "";
const disposableProject = process.env.SUPABASE_TEST_DISPOSABLE === "1";
const integrationReady = Boolean(
  projectUrl && publishableKey && editorEmail && editorPassword && ownerEmail && ownerPassword &&
  nonAdminEmail && nonAdminPassword && disposableProject,
);

function createTestClient() {
  return createClient(projectUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

function expectDenied(result: { error: unknown; data?: unknown[] | null }) {
  assert.ok(result.error || !result.data?.length, "the operation should be denied by grants or RLS");
}

function expectInsufficientPrivilege(error: { code?: string } | null) {
  assert.ok(error, "the operation should be denied by grants or RLS");
  assert.equal(error.code, "42501");
}

test("Supabase live CMS/Auth/RLS/Storage integration", { skip: integrationReady ? false : "Needs a disposable project, publishable key, and editor/owner/non-admin test accounts." }, async () => {
  const anon = createTestClient();
  const editor = createTestClient();
  const owner = createTestClient();
  const nonAdmin = createTestClient();
  const bucket = "site-media";
  let uploadedPath: string | null = null;
  let temporaryAdminProfileId: string | null = null;

  try {
    const [editorLogin, ownerLogin, nonAdminLogin] = await Promise.all([
      editor.auth.signInWithPassword({ email: editorEmail, password: editorPassword }),
      owner.auth.signInWithPassword({ email: ownerEmail, password: ownerPassword }),
      nonAdmin.auth.signInWithPassword({ email: nonAdminEmail, password: nonAdminPassword }),
    ]);
    assert.ifError(editorLogin.error);
    assert.ifError(ownerLogin.error);
    assert.ifError(nonAdminLogin.error);
    assert.ok(editorLogin.data.user);
    assert.ok(ownerLogin.data.user);
    assert.ok(nonAdminLogin.data.user);

    const settingsResult = await anon
      .from("site_settings")
      .select("site_title, seo_description, design_tokens")
      .eq("singleton", true)
      .single();
    assert.ifError(settingsResult.error);

    const sectionsResult = await anon
      .from("site_sections")
      .select("section_key, is_visible, sort_order, content, presentation")
      .order("sort_order");
    assert.ifError(sectionsResult.error);
    const sections = siteCmsPayloadSchema.shape.sections.parse(sectionsResult.data);
    assert.equal(sections.every((section) => section.is_visible), true);

    const imagesResult = await anon
      .from("site_images")
      .select("image_key, label, storage_path, local_fallback_path, alt_text, mime_type, file_size, width, height");
    assert.ifError(imagesResult.error);
    const payload = siteCmsPayloadSchema.parse({ settings: settingsResult.data, sections, images: imagesResult.data });
    const mapped = mapSiteCmsPayload(payload, projectUrl);
    assert.equal(mapped.visibleSections.length, 5);
    assert.equal(mapped.content.requirements.items.length, 6);
    assert.equal(mapped.content.positions.items.length, 11);
    assert.equal(mapped.content.facilities.items.length, 5);

    const nonAdminProfile = await nonAdmin
      .from("admin_profiles")
      .select("user_id")
      .eq("user_id", nonAdminLogin.data.user.id);
    assert.ifError(nonAdminProfile.error);
    assert.equal(nonAdminProfile.data.length, 0);
    expectDenied(await anon.from("admin_profiles").select("user_id"));

    const anonInsert = await anon.from("site_sections").insert({
      section_key: "requirements",
      is_visible: true,
      sort_order: 1,
      content: {},
      presentation: {},
    });
    expectInsufficientPrivilege(anonInsert.error);
    expectDenied(await anon.from("site_sections").update({ sort_order: 999 }).eq("section_key", "requirements").select("section_key"));
    expectDenied(await anon.from("site_sections").delete().eq("section_key", "requirements").select("section_key"));

    const requirements = sections.find((section) => section.section_key === "requirements");
    assert.ok(requirements);
    const editorContentWrite = await editor
      .from("site_sections")
      .update({ content: requirements.content, presentation: requirements.presentation })
      .eq("section_key", requirements.section_key)
      .select("section_key")
      .single();
    assert.ifError(editorContentWrite.error);

    const editorDesignWrite = await editor
      .from("site_settings")
      .update({ design_tokens: payload.settings.design_tokens })
      .eq("singleton", true)
      .select("id")
      .single();
    assert.ifError(editorDesignWrite.error);

    const image = payload.images[0];
    const editorImageWrite = await editor
      .from("site_images")
      .update({ label: image.label, alt_text: image.alt_text })
      .eq("image_key", image.image_key)
      .select("image_key")
      .single();
    assert.ifError(editorImageWrite.error);

    expectDenied(await editor
      .from("admin_profiles")
      .update({ role: "owner" })
      .eq("user_id", editorLogin.data.user.id)
      .select("role"));
    const editorProfile = await editor
      .from("admin_profiles")
      .select("role, is_active")
      .eq("user_id", editorLogin.data.user.id)
      .single();
    assert.ifError(editorProfile.error);
    assert.equal(editorProfile.data.role, "editor");
    assert.equal(editorProfile.data.is_active, true);

    const directory = await owner.rpc("list_site_admins");
    assert.ifError(directory.error);
    assert.ok(directory.data.some((profile: { user_id: string }) => profile.user_id === ownerLogin.data.user.id));
    const candidates = await owner.rpc("list_unassigned_site_users");
    assert.ifError(candidates.error);
    assert.ok(candidates.data.some((candidate: { user_id: string }) => candidate.user_id === nonAdminLogin.data.user.id));
    const nonAdminCandidates = await nonAdmin.rpc("list_unassigned_site_users");
    assert.ifError(nonAdminCandidates.error);
    assert.equal(nonAdminCandidates.data.length, 0);

    const newAdmin = await owner.from("admin_profiles").insert({
      user_id: nonAdminLogin.data.user.id,
      role: "editor",
      is_active: true,
    }).select("user_id").single();
    assert.ifError(newAdmin.error);
    temporaryAdminProfileId = newAdmin.data.user_id;
    assert.ifError((await owner.from("admin_profiles").update({ role: "owner" }).eq("user_id", temporaryAdminProfileId)).error);
    assert.ifError((await owner.from("admin_profiles").update({ role: "editor" }).eq("user_id", temporaryAdminProfileId)).error);

    const auditRows = await editor.rpc("get_site_activity");
    assert.ifError(auditRows.error);
    assert.ok(auditRows.data.some((row: { action: string; actor_email: string | null }) => row.action === "UPDATE" && row.actor_email === editorLogin.data.user.email));
    assert.ifError((await editor.rpc("record_site_auth_event", { p_action: "LOGIN" })).error);

    assert.ok((await editor.from("activity_logs").insert({ action: "UPDATE", entity_type: "client", actor_id: editorLogin.data.user.id })).error);
    expectDenied(await editor.from("activity_logs").update({ entity_type: "changed" }).limit(1).select("id"));
    expectDenied(await editor.from("activity_logs").delete().limit(1).select("id"));

    const owners = directory.data.filter((profile: { role: string; is_active: boolean }) => profile.role === "owner" && profile.is_active);
    assert.equal(owners.length, 1, "the disposable integration fixture must have one active owner");
    const lastOwnerChange = await owner
      .from("admin_profiles")
      .update({ role: "editor" })
      .eq("user_id", ownerLogin.data.user.id)
      .select("user_id");
    assert.equal(lastOwnerChange.error?.code, "23514");

    const optionalSection = sections.find((section) => section.section_key !== "hero" && section.section_key !== "contact");
    assert.ok(optionalSection);
    const hideSection = await editor.from("site_sections").update({ is_visible: false }).eq("section_key", optionalSection.section_key);
    assert.ifError(hideSection.error);
    try {
      const publicAfterHide = await anon.from("site_sections").select("section_key");
      assert.ifError(publicAfterHide.error);
      assert.equal(publicAfterHide.data.some((section) => section.section_key === optionalSection.section_key), false);
    } finally {
      assert.ifError((await editor.from("site_sections").update({ is_visible: true }).eq("section_key", optionalSection.section_key)).error);
    }

    const png = await sharp({
      create: { width: 1, height: 1, channels: 4, background: { r: 248, g: 146, b: 29, alpha: 1 } },
    }).png().toBuffer();
    const imagePath = `integration-test/${crypto.randomUUID()}.png`;
    const pngFile = new Blob([png], { type: "image/png" });
    assert.ok((await anon.storage.from(bucket).upload(imagePath, pngFile, { contentType: "image/png", upsert: false })).error);

    const editorUpload = await editor.storage.from(bucket).upload(imagePath, pngFile, { contentType: "image/png", upsert: false });
    assert.ifError(editorUpload.error);
    uploadedPath = imagePath;

    const publicUrl = editor.storage.from(bucket).getPublicUrl(imagePath).data.publicUrl;
    assert.equal((await fetch(publicUrl)).ok, true);
    assert.ok((await anon.storage.from(bucket).remove([imagePath])).error);
    assert.ok((await editor.storage.from(bucket).upload(imagePath, pngFile, { contentType: "image/png", upsert: true })).error);

    assert.ifError((await editor.storage.from(bucket).remove([imagePath])).error);
    uploadedPath = null;
  } finally {
    if (uploadedPath) await editor.storage.from(bucket).remove([uploadedPath]);
    if (temporaryAdminProfileId) {
      assert.ifError((await owner.from("admin_profiles").delete().eq("user_id", temporaryAdminProfileId)).error);
    }
    await Promise.all([editor.auth.signOut(), owner.auth.signOut(), nonAdmin.auth.signOut()]);
  }
});
