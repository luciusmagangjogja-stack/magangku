import { adminActivitySchema } from "@/lib/cms/admin-schemas";
import { ConnectionNotice } from "@/components/admin/ConnectionNotice";
import { createAdminPageClient } from "@/lib/supabase/admin-page-client";

const actionLabels: Record<string, string> = {
  CREATE: "Membuat",
  UPDATE: "Memperbarui",
  DELETE: "Menghapus",
  UPLOAD: "Mengganti gambar",
  LOGIN: "Masuk",
  LOGOUT: "Keluar",
};

const entityLabels: Record<string, string> = {
  site_settings: "Pengaturan website",
  site_sections: "Konten website",
  site_images: "Gambar website",
  admin_profiles: "Akun admin",
};

const sectionLabels: Record<string, string> = {
  hero: "Hero",
  requirements: "Syarat & Ketentuan",
  internship_positions: "Formasi Magang",
  facilities: "Fasilitas",
  contact: "Kontak",
};

function changeSummary(entry: ReturnType<typeof adminActivitySchema.parse>[number]) {
  if (entry.entity_type === "site_settings") return "Pengaturan tampilan diperbarui";
  if (entry.entity_type === "site_sections") return `Bagian ${sectionLabels[entry.entity_id ?? ""] ?? "website"} diperbarui`;
  if (entry.entity_type === "site_images") return `Slot ${entry.entity_id?.replaceAll("_", " ") ?? "gambar"} diperbarui`;
  if (entry.entity_type === "admin_profiles") return "Akses akun admin diperbarui";
  return "Perubahan website tercatat";
}

export default async function ActivityLogPage() {
  const supabase = await createAdminPageClient();
  if (!supabase) return <ConnectionNotice title="Riwayat perubahan" />;
  const { data, error } = await supabase.rpc("get_site_activity");
  const parsed = error ? null : adminActivitySchema.safeParse(data);

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-eyebrow">Riwayat</p>
        <h1>Riwayat perubahan</h1>
        <p>Perubahan terbaru yang dicatat oleh sistem.</p>
      </header>
      <section className="admin-panel">
        {error || !parsed?.success ? (
          <p className="admin-form-error" role="alert">Riwayat belum dapat dimuat. Pastikan migration terbaru sudah diterapkan.</p>
        ) : parsed.data.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Waktu</th><th>Admin</th><th>Perubahan</th><th>Bagian</th></tr></thead>
              <tbody>
                {parsed.data.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td>{entry.actor_email ?? "Akun tidak tersedia"}</td>
                    <td>{actionLabels[entry.action] ?? "Perubahan"}</td>
                    <td>{changeSummary(entry) || entityLabels[entry.entity_type] || "Website"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="admin-muted">Belum ada perubahan yang tercatat.</p>}
      </section>
    </>
  );
}