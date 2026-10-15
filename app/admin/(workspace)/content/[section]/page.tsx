import { notFound } from "next/navigation";
import { SectionEditor } from "../section-editor";
import { cmsSectionSchema } from "@/lib/cms/schemas";
import { siteSectionKeys } from "@/lib/cms/types";
import { ConnectionNotice } from "@/components/admin/ConnectionNotice";
import { createAdminPageClient } from "@/lib/supabase/admin-page-client";

const titles: Record<(typeof siteSectionKeys)[number], string> = {
  hero: "Hero",
  requirements: "Syarat & Ketentuan",
  internship_positions: "Formasi Magang",
  facilities: "Fasilitas",
  contact: "Kontak",
};

export default async function EditSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!siteSectionKeys.includes(section as (typeof siteSectionKeys)[number])) notFound();
  const sectionKey = section as (typeof siteSectionKeys)[number];
  const supabase = await createAdminPageClient();
  if (!supabase) return <ConnectionNotice title={titles[sectionKey]} />;
  const { data, error } = await supabase
    .from("site_sections")
    .select("section_key, is_visible, sort_order, content, presentation")
    .eq("section_key", sectionKey)
    .single();

  if (error || !data) {
    return (
      <div className="admin-panel" role="alert">
        <h1>{titles[sectionKey]}</h1>
        <p>Konten belum dapat dimuat. Periksa koneksi Supabase, lalu coba lagi.</p>
      </div>
    );
  }

  const parsed = cmsSectionSchema.safeParse(data);
  if (!parsed.success) {
    return (
      <div className="admin-panel" role="alert">
        <h1>{titles[sectionKey]}</h1>
        <p>Konten ini memiliki data yang perlu diperiksa sebelum dapat diedit.</p>
      </div>
    );
  }

  return <SectionEditor initialSection={parsed.data} title={titles[sectionKey]} />;
}