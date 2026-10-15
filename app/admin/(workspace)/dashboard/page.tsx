import Link from "next/link";
import { adminActivitySchema } from "@/lib/cms/admin-schemas";
import { cmsSectionsSchema } from "@/lib/cms/schemas";
import { ConnectionNotice } from "@/components/admin/ConnectionNotice";
import { createAdminPageClient } from "@/lib/supabase/admin-page-client";

const actionLabels: Record<string, string> = {
  CREATE: "Dibuat",
  UPDATE: "Diperbarui",
  DELETE: "Dihapus",
  UPLOAD: "Gambar diganti",
  LOGIN: "Masuk",
  LOGOUT: "Keluar",
};

const entityLabels: Record<string, string> = {
  site_settings: "Pengaturan tampilan",
  site_sections: "Konten website",
  site_images: "Gambar website",
  admin_profiles: "Akun admin",
};

export default async function AdminDashboardPage() {
  const supabase = await createAdminPageClient();
  if (!supabase) return <ConnectionNotice title="Ringkasan website" />;
  const [settingsResult, sectionsResult, imagesResult, activityResult] = await Promise.all([
    supabase.from("site_settings").select("id").eq("singleton", true).maybeSingle(),
    supabase.from("site_sections").select("section_key, is_visible, sort_order, content, presentation").order("sort_order"),
    supabase.from("site_images").select("image_key"),
    supabase.rpc("get_site_activity"),
  ]);
  const parsedSections = sectionsResult.error ? null : cmsSectionsSchema.safeParse(sectionsResult.data);
  const sections = parsedSections?.success ? parsedSections.data : [];
  const siteOnline = !settingsResult.error && Boolean(settingsResult.data) && Boolean(parsedSections?.success);
  const imageCount = imagesResult.error ? null : imagesResult.data?.length ?? 0;
  const requirementCount = sections.find((section) => section.section_key === "requirements")?.content.items.length;
  const positionCount = sections.find((section) => section.section_key === "internship_positions")?.content.items.length;
  const facilityCount = sections.find((section) => section.section_key === "facilities")?.content.items.length;
  const parsedActivity = activityResult.error ? null : adminActivitySchema.safeParse(activityResult.data);
  const activity = parsedActivity?.success ? parsedActivity.data.slice(0, 6) : [];

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-eyebrow">Magangku</p>
        <h1>Ringkasan website</h1>
        <p>Kelola konten dan tampilan website Magangku.</p>
      </header>
      <section className="admin-panel admin-stack" aria-labelledby="site-status-title">
        <div>
          <h2 id="site-status-title">Status website</h2>
          <p className={siteOnline ? "admin-notice-success" : "admin-notice-error"}>
            {siteOnline ? "Terhubung ke Supabase" : "Konten admin belum dapat dibaca. Periksa koneksi Supabase."}
          </p>
        </div>
        <div className="admin-grid">
          <article><span>Syarat & ketentuan</span><strong>{requirementCount ?? "Belum tersedia"}</strong></article>
          <article><span>Formasi magang</span><strong>{positionCount ?? "Belum tersedia"}</strong></article>
          <article><span>Fasilitas</span><strong>{facilityCount ?? "Belum tersedia"}</strong></article>
          <article><span>Slot gambar</span><strong>{imageCount ?? "Belum tersedia"}</strong></article>
        </div>
        {settingsResult.error || sectionsResult.error || !parsedSections?.success || imagesResult.error ? (
          <p className="admin-form-error" role="status">Sebagian data belum dapat dimuat. Coba muat ulang halaman.</p>
        ) : null}
      </section>
      <section className="admin-panel" style={{ marginTop: 18 }} aria-labelledby="recent-activity-title">
        <h2 id="recent-activity-title">Perubahan terbaru</h2>
        {activityResult.error || !parsedActivity?.success ? (
          <p className="admin-form-error" role="status">Riwayat perubahan belum dapat dimuat.</p>
        ) : activity.length ? (
          <ul className="admin-activity-list">
            {activity.map((entry) => (
              <li key={entry.id}>
                <span>{actionLabels[entry.action] ?? "Perubahan"} · {entityLabels[entry.entity_type] ?? "Website"}</span>
                <span>{entry.actor_email ?? "Akun admin"} · {new Date(entry.created_at).toLocaleString("id-ID")}</span>
              </li>
            ))}
          </ul>
        ) : <p className="admin-muted">Belum ada perubahan yang tercatat.</p>}
        <Link className="admin-secondary-button admin-inline-link" href="/admin/activity-log">Lihat riwayat</Link>
      </section>
    </>
  );
}