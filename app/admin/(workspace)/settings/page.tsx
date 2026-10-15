import { SiteSettingsEditor } from "./settings-editor";
import { ConnectionNotice } from "@/components/admin/ConnectionNotice";
import { siteSettingsRowSchema } from "@/lib/cms/schemas";
import { createAdminPageClient } from "@/lib/supabase/admin-page-client";

export default async function SiteSettingsPage() {
  const supabase = await createAdminPageClient();
  if (!supabase) return <ConnectionNotice title="Pengaturan website" />;
  const { data, error } = await supabase
    .from("site_settings")
    .select("site_title, seo_description, design_tokens")
    .eq("singleton", true)
    .single();

  if (error || !data) return <div className="admin-panel" role="alert"><h1>Pengaturan website</h1><p>Pengaturan belum dapat dimuat.</p></div>;
  const parsed = siteSettingsRowSchema.safeParse(data);
  if (!parsed.success) return <div className="admin-panel" role="alert"><h1>Pengaturan website</h1><p>Pengaturan perlu diperiksa sebelum diedit.</p></div>;

  return <SiteSettingsEditor title={parsed.data.site_title} description={parsed.data.seo_description} />;
}