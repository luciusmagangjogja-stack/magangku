import { redirect } from "next/navigation";
import { AdminDirectory } from "./admin-directory";
import { adminDirectorySchema, unassignedAdminSchema } from "@/lib/cms/admin-schemas";
import { requireCmsPermission } from "@/lib/cms/auth";
import { ConnectionNotice } from "@/components/admin/ConnectionNotice";
import { createAdminPageClient } from "@/lib/supabase/admin-page-client";

export default async function AdminsPage() {
  try {
    await requireCmsPermission("manage_admins");
  } catch {
    redirect("/admin/dashboard");
  }

  const supabase = await createAdminPageClient();
  if (!supabase) return <ConnectionNotice title="Pengelolaan admin" />;
  const [directoryResult, candidatesResult] = await Promise.all([
    supabase.rpc("list_site_admins"),
    supabase.rpc("list_unassigned_site_users"),
  ]);
  const parsed = directoryResult.error ? null : adminDirectorySchema.safeParse(directoryResult.data);
  const candidates = candidatesResult.error ? null : unassignedAdminSchema.safeParse(candidatesResult.data);

  return (
    <>
      <header className="admin-page-header"><p className="admin-eyebrow">Pengaturan akses</p><h1>Pengelolaan admin</h1><p>Ubah peran atau status akun yang dibuat melalui Supabase Auth.</p></header>
      <section className="admin-panel">
        {directoryResult.error || !parsed?.success ? <p className="admin-form-error" role="alert">Daftar admin belum dapat dimuat. Pastikan migration terbaru sudah diterapkan.</p> : <AdminDirectory admins={parsed.data} candidates={candidates?.success ? candidates.data : []} />}
        {candidatesResult.error ? <p className="admin-form-error" role="status">Akun Auth baru belum dapat ditampilkan. Pastikan migration terbaru sudah diterapkan.</p> : null}
      </section>
    </>
  );
}