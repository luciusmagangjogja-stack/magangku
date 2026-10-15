import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { logoutAdmin } from "../auth-actions";
import { getCurrentCmsAdmin } from "@/lib/cms/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const contentLinks = [
  ["hero", "Hero"],
  ["requirements", "Syarat & Ketentuan"],
  ["internship_positions", "Formasi Magang"],
  ["facilities", "Fasilitas"],
  ["contact", "Kontak"],
] as const;

export default async function AdminWorkspaceLayout({ children }: Readonly<{ children: ReactNode }>) {
  if (!isSupabaseConfigured()) redirect("/admin/login?reason=setup");

  let admin;
  try {
    admin = await getCurrentCmsAdmin();
  } catch {
    redirect("/admin/login?reason=setup");
  }
  if (!admin) redirect("/admin/login?reason=access");

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin/dashboard">Magangku</Link>
        <p className="admin-nav-label">Ruang kerja</p>
        <nav aria-label="Navigasi admin">
          <Link className="admin-nav-link" href="/admin/dashboard">Ringkasan</Link>
          <p className="admin-nav-label">Konten website</p>
          {contentLinks.map(([key, label]) => (
            <Link className="admin-nav-link admin-nav-child" href={`/admin/content/${key}`} key={key}>
              {label}
            </Link>
          ))}
          <p className="admin-nav-label">Tampilan & media</p>
          <Link className="admin-nav-link" href="/admin/design">Tampilan website</Link>
          <Link className="admin-nav-link" href="/admin/images">Gambar</Link>
          <Link className="admin-nav-link" href="/admin/activity-log">Riwayat perubahan</Link>
          <Link className="admin-nav-link" href="/admin/settings">Pengaturan website</Link>
          {admin.role === "owner" ? (
            <Link className="admin-nav-link" href="/admin/settings/admins">Pengelolaan admin</Link>
          ) : null}
        </nav>
        <div className="admin-sidebar-footer">
          <span className="admin-role-label">{admin.role === "owner" ? "Pemilik" : "Editor"}</span>
          <form action={logoutAdmin}>
            <button className="admin-text-button" type="submit">Keluar</button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}