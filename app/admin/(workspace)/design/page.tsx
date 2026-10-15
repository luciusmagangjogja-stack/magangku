import { DesignEditor } from "./design-editor";
import { ConnectionNotice } from "@/components/admin/ConnectionNotice";
import { siteSettingsRowSchema } from "@/lib/cms/schemas";
import { createAdminPageClient } from "@/lib/supabase/admin-page-client";

export default async function DesignPage() {
  const supabase = await createAdminPageClient();
  if (!supabase) return <ConnectionNotice title="Tampilan website" />;
  const { data, error } = await supabase
    .from("site_settings")
    .select("site_title, seo_description, design_tokens")
    .eq("singleton", true)
    .single();

  if (error || !data) {
    return <div className="admin-panel" role="alert"><h1>Tampilan website</h1><p>Pengaturan tampilan belum dapat dimuat.</p></div>;
  }
  const parsed = siteSettingsRowSchema.safeParse(data);
  if (!parsed.success) {
    return <div className="admin-panel" role="alert"><h1>Tampilan website</h1><p>Pengaturan perlu diperiksa sebelum dapat diedit.</p></div>;
  }

  return <DesignEditor initialTokens={parsed.data.design_tokens} />;
}