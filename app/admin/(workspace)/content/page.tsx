import Link from "next/link";

const sections = [
  ["hero", "Hero", "Judul dan deskripsi pembuka"],
  ["requirements", "Syarat & Ketentuan", "Daftar syarat pendaftaran"],
  ["internship_positions", "Formasi Magang", "Daftar posisi yang tersedia"],
  ["facilities", "Fasilitas", "Fasilitas program magang"],
  ["contact", "Kontak", "Informasi WhatsApp dan pendaftaran"],
] as const;

export default function ContentOverviewPage() {
  return (
    <>
      <header className="admin-page-header">
        <p className="admin-eyebrow">Konten website</p>
        <h1>Bagian website</h1>
        <p>Pilih bagian yang ingin diperbarui.</p>
      </header>
      <div className="admin-section-cards">
        {sections.map(([key, title, description]) => (
          <Link className="admin-section-card" href={`/admin/content/${key}`} key={key}>
            <strong>{title}</strong>
            <span>{description}</span>
            <span className="admin-card-action">Buka bagian →</span>
          </Link>
        ))}
      </div>
    </>
  );
}