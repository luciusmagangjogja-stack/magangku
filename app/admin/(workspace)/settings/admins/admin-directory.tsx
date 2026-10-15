"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAdminProfile, updateAdminProfile } from "../../../actions";
import type { AdminDirectoryEntry, UnassignedAdminEntry } from "@/lib/cms/admin-schemas";

function AdminRow({ admin }: { admin: AdminDirectoryEntry }) {
  const [role, setRole] = useState(admin.role);
  const [active, setActive] = useState(admin.is_active);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => setNotice(await updateAdminProfile({ user_id: admin.user_id, role, is_active: active })));
  }

  return (
    <tr>
      <td>{admin.email ?? "Email tidak tersedia"}</td>
      <td><label className="admin-compact-field">Peran<select value={role} onChange={(event) => setRole(event.target.value as typeof role)}><option value="editor">Editor</option><option value="owner">Pemilik</option></select></label></td>
      <td><label className="admin-compact-field"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Aktif</label></td>
      <td><button className="admin-secondary-button" type="button" onClick={save} disabled={pending}><Save size={16} /> Simpan</button>{notice ? <span className={notice.ok ? "admin-notice-success" : "admin-notice-error"} role="status">{notice.message}</span> : null}</td>
    </tr>
  );
}

export function AdminDirectory({ admins, candidates }: { admins: AdminDirectoryEntry[]; candidates: UnassignedAdminEntry[] }) {
  const [candidateId, setCandidateId] = useState("");
  const [role, setRole] = useState<"owner" | "editor">("editor");
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function addAdmin() {
    if (!candidateId) {
      setNotice({ ok: false, message: "Pilih akun yang akan diberi akses." });
      return;
    }
    if (role === "owner" && !window.confirm("Berikan akses pemilik penuh ke akun ini?")) return;
    startTransition(async () => {
      const result = await createAdminProfile({ user_id: candidateId, role });
      setNotice(result);
      if (result.ok) {
        setCandidateId("");
        router.refresh();
      }
    });
  }

  return (
    <div className="admin-stack">
      {admins.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Email</th><th>Peran</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>{admins.map((admin) => <AdminRow key={admin.user_id} admin={admin} />)}</tbody>
          </table>
        </div>
      ) : <p className="admin-muted">Belum ada akun admin yang terdaftar.</p>}
      <section className="admin-panel admin-stack">
        <h2>Tambah akun admin</h2>
        {candidates.length ? (
          <>
            <label className="admin-field">Akun Supabase Auth
              <select value={candidateId} onChange={(event) => setCandidateId(event.target.value)}>
                <option value="">Pilih akun</option>
                {candidates.map((candidate) => <option value={candidate.user_id} key={candidate.user_id}>{candidate.email}</option>)}
              </select>
            </label>
            <label className="admin-field">Peran
              <select value={role} onChange={(event) => setRole(event.target.value as typeof role)}><option value="editor">Editor</option><option value="owner">Pemilik</option></select>
            </label>
            <div className="admin-actions"><button className="admin-primary-button" type="button" onClick={addAdmin} disabled={pending}><Save size={16} /> {pending ? "Menambahkan..." : "Beri akses"}</button>{notice ? <span className={notice.ok ? "admin-notice-success" : "admin-notice-error"} role="status">{notice.message}</span> : null}</div>
          </>
        ) : <p className="admin-muted">Belum ada akun baru tanpa akses admin. Buat akun melalui Supabase Auth terlebih dahulu.</p>}
        <p className="admin-muted">Setidaknya satu pemilik aktif harus dipertahankan.</p>
      </section>
    </div>
  );
}