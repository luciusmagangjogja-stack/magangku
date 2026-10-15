import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "../login-form";
import { getCurrentCmsAdmin } from "@/lib/cms/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  let admin = null;
  if (isSupabaseConfigured()) {
    try {
      admin = await getCurrentCmsAdmin();
    } catch {
      // The login form explains authentication service errors after submit.
    }
  }
  if (admin) redirect("/admin/dashboard");

  const { reason } = await searchParams;

  return (
    <main className="admin-login-page">
      <section className="admin-login-panel" aria-labelledby="admin-login-title">
        <Link className="admin-brand" href="/">Magangku</Link>
        <p className="admin-eyebrow">Ruang pengelola</p>
        <h1 id="admin-login-title">Masuk ke Admin</h1>
        <p className="admin-muted">Gunakan akun administrator yang sudah didaftarkan.</p>
        <LoginForm reason={reason} />
      </section>
    </main>
  );
}