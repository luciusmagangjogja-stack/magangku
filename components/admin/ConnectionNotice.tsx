export function ConnectionNotice({ title }: { title: string }) {
  return (
    <div className="admin-panel" role="status">
      <h1>{title}</h1>
      <p>Halaman admin belum dapat terhubung ke Supabase. Periksa pengaturan koneksi, lalu coba lagi.</p>
    </div>
  );
}