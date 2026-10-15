import { ImageManager } from "./image-manager";
import { ConnectionNotice } from "@/components/admin/ConnectionNotice";
import { siteImageRowSchema } from "@/lib/cms/schemas";
import { getSupabaseEnvironment } from "@/lib/supabase/config";
import { createAdminPageClient } from "@/lib/supabase/admin-page-client";

export default async function ImagesPage() {
  const supabase = await createAdminPageClient();
  if (!supabase) return <ConnectionNotice title="Gambar website" />;
  const { data, error } = await supabase
    .from("site_images")
    .select("image_key, label, storage_path, local_fallback_path, alt_text, mime_type, file_size, width, height")
    .order("image_key");

  if (error || !data) {
    return <div className="admin-panel" role="alert"><h1>Gambar website</h1><p>Slot gambar belum dapat dimuat.</p></div>;
  }

  const parsed = siteImageRowSchema.array().length(7).safeParse(data);
  if (!parsed.success) {
    return <div className="admin-panel" role="alert"><h1>Gambar website</h1><p>Informasi gambar perlu diperiksa sebelum dapat dikelola.</p></div>;
  }

  const config = getSupabaseEnvironment();
  const images = parsed.data.map((image) => {
    const segments = image.storage_path?.split("/").map(encodeURIComponent);
    const src = segments && config
      ? `${config.url}/storage/v1/object/public/site-media/${segments.join("/")}`
      : image.local_fallback_path;
    return { ...image, src };
  });

  return <ImageManager images={images} />;
}