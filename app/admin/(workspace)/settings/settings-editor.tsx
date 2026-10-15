"use client";

import { Save } from "lucide-react";
import { useState, useTransition } from "react";
import { saveSiteMetadata } from "../../actions";

export function SiteSettingsEditor({ title, description }: { title: string; description: string }) {
  const [siteTitle, setSiteTitle] = useState(title);
  const [seoDescription, setSeoDescription] = useState(description);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => setNotice(await saveSiteMetadata({ site_title: siteTitle, seo_description: seoDescription })));
  }

  return (
    <>
      <header className="admin-page-header"><p className="admin-eyebrow">Pengaturan</p><h1>Identitas website</h1><p>Atur judul tab browser dan ringkasan website.</p></header>
      <section className="admin-panel admin-stack">
        <label className="admin-field">Judul website<input required maxLength={120} value={siteTitle} onChange={(event) => setSiteTitle(event.target.value)} /></label>
        <label className="admin-field">Deskripsi website<textarea required maxLength={320} value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} /></label>
        <div className="admin-actions"><button className="admin-primary-button" type="button" onClick={save} disabled={pending}><Save size={16} /> {pending ? "Menyimpan..." : "Simpan pengaturan"}</button>{notice ? <span className={notice.ok ? "admin-notice-success" : "admin-notice-error"} role="status">{notice.message}</span> : null}</div>
      </section>
    </>
  );
}