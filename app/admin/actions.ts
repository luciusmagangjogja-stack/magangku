"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCmsPermission } from "@/lib/cms/auth";
import { decodeImageUpload } from "@/lib/cms/image-decode.server";
import { adminProfileSchema, cmsSectionSchema, designTokensSchema, siteSettingsRowSchema } from "@/lib/cms/schemas";
import { siteImageKeys } from "@/lib/cms/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminActionResult {
  ok: boolean;
  message: string;
}

const imageKeySchema = z.enum(siteImageKeys);
const profileUpdateSchema = adminProfileSchema.pick({ user_id: true, role: true, is_active: true });
const profileCreateSchema = adminProfileSchema.pick({ user_id: true, role: true });
const siteMetadataSchema = siteSettingsRowSchema.pick({ site_title: true, seo_description: true });
const imageDetailsSchema = z.object({
  image_key: imageKeySchema,
  label: z.string().trim().min(1).max(120),
  alt_text: z.string().trim().max(500),
});
const uploadedImageSchema = imageDetailsSchema.extend({
  storage_path: z.string().regex(/^[a-z_]+\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/i),
  mime_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  file_size: z.number().int().min(1).max(5 * 1024 * 1024),
  width: z.number().int().min(1).max(12000),
  height: z.number().int().min(1).max(12000),
}).strict().superRefine((image, context) => {
  const extension = image.mime_type === "image/jpeg" ? "jpg" : image.mime_type.slice("image/".length);
  const fileName = image.storage_path.split("/")[1] ?? "";
  const uuid = fileName.slice(0, -(extension.length + 1));
  if (
    !image.storage_path.startsWith(`${image.image_key}/`) ||
    !image.storage_path.endsWith(`.${extension}`) ||
    !z.string().uuid().safeParse(uuid).success
  ) {
    context.addIssue({ code: "custom", message: "Image path and MIME type must match the selected slot." });
  }
});

async function getAuthorizedClient(permission: "edit_content" | "edit_design" | "manage_images" | "manage_admins") {
  try {
    await requireCmsPermission(permission);
    return await createSupabaseServerClient();
  } catch {
    return null;
  }
}

function reportDatabaseFailure(event: string, error: { code?: string; name?: string }) {
  console.error(`[admin] ${event} failed.`, { code: error.code ?? error.name ?? "UnknownError" });
}

function refreshPublicContent() {
  revalidatePath("/", "page");
  revalidatePath("/admin", "layout");
}

export async function saveSection(input: unknown): Promise<AdminActionResult> {
  const parsed = cmsSectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ada isian yang belum sesuai. Periksa kembali sebelum menyimpan." };

  const supabase = await getAuthorizedClient("edit_content");
  if (!supabase) return { ok: false, message: "Sesi admin tidak aktif. Silakan masuk kembali." };

  try {
    const section = parsed.data;
    const { data, error } = await supabase
      .from("site_sections")
      .update({
        is_visible: section.is_visible,
        sort_order: section.sort_order,
        content: section.content,
        presentation: section.presentation,
      })
      .eq("section_key", section.section_key)
      .select("section_key")
      .maybeSingle();

    if (error) {
      reportDatabaseFailure("content save", error);
      return { ok: false, message: "Perubahan belum tersimpan. Periksa koneksi, lalu coba lagi." };
    }
    if (!data) return { ok: false, message: "Konten tidak dapat diperbarui oleh akun ini." };

    refreshPublicContent();
    revalidatePath(`/admin/content/${section.section_key}`);
    return { ok: true, message: "Perubahan berhasil disimpan." };
  } catch (error) {
    reportDatabaseFailure("content save", error instanceof Error ? { name: error.name } : {});
    return { ok: false, message: "Perubahan belum tersimpan. Coba lagi sebentar." };
  }
}

export async function saveDesignTokens(input: unknown): Promise<AdminActionResult> {
  const parsed = designTokensSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Periksa kembali warna, ukuran, dan jarak yang dipilih." };

  const supabase = await getAuthorizedClient("edit_design");
  if (!supabase) return { ok: false, message: "Sesi admin tidak aktif. Silakan masuk kembali." };

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .update({ design_tokens: parsed.data })
      .eq("singleton", true)
      .select("id")
      .maybeSingle();
    if (error) {
      reportDatabaseFailure("design save", error);
      return { ok: false, message: "Tampilan belum tersimpan. Periksa koneksi, lalu coba lagi." };
    }
    if (!data) return { ok: false, message: "Tampilan tidak dapat diperbarui oleh akun ini." };

    refreshPublicContent();
    revalidatePath("/admin/design");
    return { ok: true, message: "Tampilan website berhasil diperbarui." };
  } catch (error) {
    reportDatabaseFailure("design save", error instanceof Error ? { name: error.name } : {});
    return { ok: false, message: "Tampilan belum tersimpan. Coba lagi sebentar." };
  }
}

export async function updateAdminProfile(input: unknown): Promise<AdminActionResult> {
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Data admin tidak valid." };

  const supabase = await getAuthorizedClient("manage_admins");
  if (!supabase) return { ok: false, message: "Hanya pemilik aktif yang dapat mengelola akun admin." };

  try {
    const profile = parsed.data;
    const { data, error } = await supabase
      .from("admin_profiles")
      .update({ role: profile.role, is_active: profile.is_active })
      .eq("user_id", profile.user_id)
      .select("user_id")
      .maybeSingle();
    if (error) {
      reportDatabaseFailure("admin profile update", error);
      if (error.code === "23514") {
        return { ok: false, message: "Setidaknya satu pemilik aktif harus tetap ada." };
      }
      return { ok: false, message: "Perubahan akun admin belum tersimpan." };
    }
    if (!data) return { ok: false, message: "Akun ini tidak dapat diubah oleh peran Anda." };

    revalidatePath("/admin/settings/admins");
    return { ok: true, message: "Akses admin berhasil diperbarui." };
  } catch (error) {
    reportDatabaseFailure("admin profile update", error instanceof Error ? { name: error.name } : {});
    return { ok: false, message: "Perubahan akun admin belum tersimpan." };
  }
}

export async function saveUploadedImageMetadata(input: unknown): Promise<AdminActionResult> {
  const parsed = uploadedImageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Informasi gambar atau file tidak sesuai." };
  const supabase = await getAuthorizedClient("manage_images");
  if (!supabase) return { ok: false, message: "Sesi admin tidak aktif. Silakan masuk kembali." };

  const { image_key, label, alt_text, storage_path, mime_type, file_size, width, height } = parsed.data;
  const { data: current, error: readError } = await supabase
    .from("site_images")
    .select("storage_path")
    .eq("image_key", image_key)
    .single();
  if (readError) {
    reportDatabaseFailure("image metadata read", readError);
    return { ok: false, message: "Slot gambar belum dapat dibaca." };
  }

  const { data: uploadedObject, error: downloadError } = await supabase.storage.from("site-media").download(storage_path);
  if (downloadError || !uploadedObject) {
    reportDatabaseFailure("uploaded image verification", downloadError ?? {});
    return { ok: false, message: "File unggahan belum dapat diverifikasi." };
  }

  let inspected;
  try {
    inspected = await decodeImageUpload(new File([await uploadedObject.arrayBuffer()], storage_path, { type: uploadedObject.type }));
  } catch (error) {
    reportDatabaseFailure("uploaded image verification", error instanceof Error ? { name: error.name } : {});
    await supabase.storage.from("site-media").remove([storage_path]);
    return { ok: false, message: "Isi file tidak sesuai dengan format gambar yang diizinkan." };
  }
  if (
    inspected.mimeType !== mime_type || inspected.fileSize !== file_size ||
    inspected.width !== width || inspected.height !== height
  ) {
    await supabase.storage.from("site-media").remove([storage_path]);
    return { ok: false, message: "Informasi file tidak cocok. File sementara sudah dihapus." };
  }

  let imageUpdate = supabase
    .from("site_images")
    .update({
      label,
      storage_path,
      alt_text,
      mime_type,
      file_size,
      width,
      height,
    })
    .eq("image_key", image_key);
  imageUpdate = current.storage_path
    ? imageUpdate.eq("storage_path", current.storage_path)
    : imageUpdate.is("storage_path", null);
  const { data: updated, error: updateError } = await imageUpdate.select("image_key").maybeSingle();

  if (updateError || !updated) {
    reportDatabaseFailure("image metadata save", updateError ?? {});
    await supabase.storage.from("site-media").remove([storage_path]);
    return { ok: false, message: "Slot gambar berubah atau tidak dapat diperbarui. Muat ulang halaman dan coba lagi." };
  }

  let message = "Gambar berhasil diganti.";
  if (current.storage_path) {
    const { error: removeOldError } = await supabase.storage.from("site-media").remove([current.storage_path]);
    if (removeOldError) {
      reportDatabaseFailure("old image cleanup", removeOldError);
      message = "Gambar baru sudah aktif, tetapi file lama belum dapat dibersihkan.";
    }
  }

  refreshPublicContent();
  revalidatePath("/admin/images");
  return { ok: true, message };
}

export async function removeSiteImage(input: unknown): Promise<AdminActionResult> {
  const parsedKey = imageKeySchema.safeParse(input);
  if (!parsedKey.success) return { ok: false, message: "Slot gambar tidak valid." };

  const supabase = await getAuthorizedClient("manage_images");
  if (!supabase) return { ok: false, message: "Sesi admin tidak aktif. Silakan masuk kembali." };

  const { data: current, error: readError } = await supabase
    .from("site_images")
    .select("storage_path")
    .eq("image_key", parsedKey.data)
    .single();
  if (readError) {
    reportDatabaseFailure("image metadata read", readError);
    return { ok: false, message: "Slot gambar belum dapat dibaca." };
  }
  if (!current.storage_path) return { ok: true, message: "Slot ini sudah menggunakan gambar bawaan." };

  const { data: updated, error: updateError } = await supabase
    .from("site_images")
    .update({ storage_path: null })
    .eq("image_key", parsedKey.data)
    .eq("storage_path", current.storage_path)
    .select("image_key")
    .maybeSingle();
  if (updateError || !updated) {
    reportDatabaseFailure("image fallback restore", updateError ?? {});
    return { ok: false, message: "Gambar bawaan belum dapat dipulihkan." };
  }

  const { error: removeError } = await supabase.storage.from("site-media").remove([current.storage_path]);
  if (removeError) {
    reportDatabaseFailure("image delete", removeError);
    const { error: restoreError } = await supabase
      .from("site_images")
      .update({ storage_path: current.storage_path })
      .eq("image_key", parsedKey.data)
      .is("storage_path", null)
      .select("image_key")
      .maybeSingle();
    if (restoreError) reportDatabaseFailure("image reference restore", restoreError);
    return {
      ok: false,
      message: restoreError
        ? "Gambar bawaan tetap aktif, tetapi file lama belum dapat dibersihkan."
        : "Gambar belum terhapus; referensi sebelumnya dipulihkan jika slot belum berubah.",
    };
  }

  refreshPublicContent();
  revalidatePath("/admin/images");
  return { ok: true, message: "Gambar unggahan dihapus. Website kembali memakai gambar bawaan." };
}

export async function saveSiteMetadata(input: unknown): Promise<AdminActionResult> {
  const parsed = siteMetadataSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Judul atau deskripsi belum sesuai batas yang diizinkan." };

  const supabase = await getAuthorizedClient("edit_content");
  if (!supabase) return { ok: false, message: "Sesi admin tidak aktif. Silakan masuk kembali." };

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .update(parsed.data)
      .eq("singleton", true)
      .select("id")
      .maybeSingle();
    if (error) {
      reportDatabaseFailure("site metadata save", error);
      return { ok: false, message: "Pengaturan website belum tersimpan." };
    }
    if (!data) return { ok: false, message: "Pengaturan tidak dapat diperbarui oleh akun ini." };
    refreshPublicContent();
    revalidatePath("/admin/settings");
    return { ok: true, message: "Pengaturan website berhasil disimpan." };
  } catch (error) {
    reportDatabaseFailure("site metadata save", error instanceof Error ? { name: error.name } : {});
    return { ok: false, message: "Pengaturan website belum tersimpan." };
  }
}

export async function saveImageMetadata(input: unknown): Promise<AdminActionResult> {
  const parsed = imageDetailsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Nama atau teks alternatif gambar belum sesuai." };

  const supabase = await getAuthorizedClient("manage_images");
  if (!supabase) return { ok: false, message: "Sesi admin tidak aktif. Silakan masuk kembali." };

  try {
    const { data, error } = await supabase
      .from("site_images")
      .update({ label: parsed.data.label, alt_text: parsed.data.alt_text })
      .eq("image_key", parsed.data.image_key)
      .select("image_key")
      .maybeSingle();
    if (error) {
      reportDatabaseFailure("image metadata save", error);
      return { ok: false, message: "Informasi gambar belum tersimpan." };
    }
    if (!data) return { ok: false, message: "Informasi gambar tidak dapat diubah oleh akun ini." };
    refreshPublicContent();
    revalidatePath("/admin/images");
    return { ok: true, message: "Informasi gambar berhasil disimpan." };
  } catch (error) {
    reportDatabaseFailure("image metadata save", error instanceof Error ? { name: error.name } : {});
    return { ok: false, message: "Informasi gambar belum tersimpan." };
  }
}

export async function createAdminProfile(input: unknown): Promise<AdminActionResult> {
  const parsed = profileCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Pilih akun dan peran admin yang valid." };

  const supabase = await getAuthorizedClient("manage_admins");
  if (!supabase) return { ok: false, message: "Hanya pemilik aktif yang dapat memberi akses admin." };

  try {
    const { error } = await supabase.from("admin_profiles").insert({
      user_id: parsed.data.user_id,
      role: parsed.data.role,
      is_active: true,
    });
    if (error) {
      reportDatabaseFailure("admin profile create", error);
      return { ok: false, message: error.code === "23505" ? "Akun ini sudah memiliki akses admin." : "Akses admin belum berhasil ditambahkan." };
    }
    revalidatePath("/admin/settings/admins");
    return { ok: true, message: "Akses admin berhasil ditambahkan." };
  } catch (error) {
    reportDatabaseFailure("admin profile create", error instanceof Error ? { name: error.name } : {});
    return { ok: false, message: "Akses admin belum berhasil ditambahkan." };
  }
}