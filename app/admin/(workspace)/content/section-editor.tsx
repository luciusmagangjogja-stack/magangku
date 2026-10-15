"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { saveSection } from "../../actions";
import type { CmsSection } from "@/lib/cms/schemas";

type EditorProps = { section: CmsSection; onChange: (section: CmsSection) => void };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="admin-field">{label}{children}</label>;
}

function OrderButtons({ onUp, onDown, disabledDown }: { onUp: () => void; onDown: () => void; disabledDown: boolean }) {
  return (
    <div className="admin-item-order">
      <button className="admin-icon-button" type="button" onClick={onUp} aria-label="Pindahkan ke atas" title="Pindahkan ke atas"><ArrowUp size={16} /></button>
      <button className="admin-icon-button" type="button" onClick={onDown} disabled={disabledDown} aria-label="Pindahkan ke bawah" title="Pindahkan ke bawah"><ArrowDown size={16} /></button>
    </div>
  );
}

function HeroFields({ section, onChange }: EditorProps & { section: Extract<CmsSection, { section_key: "hero" }> }) {
  return (
    <div className="admin-stack">
      <Field label="Judul, satu baris per bagian">
        <textarea maxLength={366} value={section.content.titleLines.join("\n")} onChange={(event) => onChange({ ...section, content: { ...section.content, titleLines: event.target.value.split("\n").slice(0, 3) } })} />
      </Field>
      <Field label="Deskripsi">
        <textarea maxLength={5000} value={section.content.paragraphs.join("\n\n")} onChange={(event) => onChange({ ...section, content: { ...section.content, paragraphs: event.target.value.split(/\n\s*\n/).slice(0, 5) } })} />
      </Field>
      <p className="admin-muted">Gambar pembuka dan susunannya dikelola melalui halaman Gambar.</p>
    </div>
  );
}

function RequirementsFields({ section, onChange }: EditorProps & { section: Extract<CmsSection, { section_key: "requirements" }> }) {
  const updateItem = (id: string, text: string) => onChange({
    ...section,
    content: { ...section.content, items: section.content.items.map((item) => item.id === id ? { ...item, text } : item) },
  });
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= section.content.items.length) return;
    const items = [...section.content.items];
    const [item] = items.splice(index, 1);
    items.splice(target, 0, item);
    const orderedIds = new Map(items.map((entry, itemIndex) => [entry.id, itemIndex]));
    onChange({ ...section, content: { ...section.content, items }, presentation: { ...section.presentation, items: [...section.presentation.items].sort((a, b) => orderedIds.get(a.id)! - orderedIds.get(b.id)!) } });
  };
  const add = () => {
    const id = `requirement-${crypto.randomUUID()}`;
    onChange({
      ...section,
      content: { ...section.content, items: [...section.content.items, { id, text: "" }] },
      presentation: { ...section.presentation, items: [...section.presentation.items, { id, icon: "document", tone: "green" }] },
    });
  };
  const remove = (id: string) => onChange({
    ...section,
    content: { ...section.content, items: section.content.items.filter((item) => item.id !== id) },
    presentation: { ...section.presentation, items: section.presentation.items.filter((item) => item.id !== id) },
  });

  return (
    <div className="admin-stack">
      <Field label="Judul bagian"><input maxLength={120} value={section.content.title} onChange={(event) => onChange({ ...section, content: { ...section.content, title: event.target.value } })} /></Field>
      {section.content.items.map((item, index) => {
        const presentation = section.presentation.items.find((entry) => entry.id === item.id)!;
        return (
          <div className="admin-item-editor" key={item.id}>
            <Field label={`Syarat ${index + 1}`}><textarea maxLength={2000} value={item.text} onChange={(event) => updateItem(item.id, event.target.value)} /></Field>
            <Field label="Ikon">
              <select value={presentation.icon} onChange={(event) => onChange({ ...section, presentation: { ...section.presentation, items: section.presentation.items.map((entry) => entry.id === item.id ? { ...entry, icon: event.target.value as typeof entry.icon } : entry) } })}>
                <option value="wifi">Internet</option><option value="document">Dokumen</option><option value="mail">Email</option><option value="sparkles">Keterampilan</option><option value="book">Belajar</option><option value="shield">Tanggung jawab</option>
              </select>
            </Field>
            <Field label="Warna"><select value={presentation.tone} onChange={(event) => onChange({ ...section, presentation: { ...section.presentation, items: section.presentation.items.map((entry) => entry.id === item.id ? { ...entry, tone: event.target.value as typeof entry.tone } : entry) } })}><option value="green">Hijau</option><option value="orange">Oranye</option></select></Field>
            <OrderButtons onUp={() => move(index, -1)} onDown={() => move(index, 1)} disabledDown={index === section.content.items.length - 1} />
            <button className="admin-icon-button admin-icon-danger" type="button" onClick={() => { if (window.confirm("Hapus syarat ini?")) remove(item.id); }} aria-label="Hapus syarat" title="Hapus syarat" disabled={section.content.items.length === 1}><Trash2 size={17} /></button>
          </div>
        );
      })}
      <button className="admin-secondary-button" type="button" onClick={add}><Plus size={16} /> Tambah syarat</button>
    </div>
  );
}

function PositionFields({ section, onChange }: EditorProps & { section: Extract<CmsSection, { section_key: "internship_positions" }> }) {
  const update = (index: number, name: string) => onChange({ ...section, content: { ...section.content, items: section.content.items.map((item, itemIndex) => itemIndex === index ? { ...item, name } : item) } });
  const move = (index: number, direction: -1 | 1) => {
    const items = [...section.content.items];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const [item] = items.splice(index, 1);
    items.splice(target, 0, item);
    onChange({ ...section, content: { ...section.content, items } });
  };
  const remove = (id: string) => onChange({ ...section, content: { ...section.content, items: section.content.items.filter((item) => item.id !== id) } });

  return (
    <div className="admin-stack">
      <Field label="Judul bagian"><input maxLength={120} value={section.content.title} onChange={(event) => onChange({ ...section, content: { ...section.content, title: event.target.value } })} /></Field>
      {section.content.items.map((item, index) => (
        <div className="admin-item-editor" key={item.id}>
          <Field label={`Formasi ${index + 1}`}><input maxLength={120} value={item.name} onChange={(event) => update(index, event.target.value)} /></Field>
          <OrderButtons onUp={() => move(index, -1)} onDown={() => move(index, 1)} disabledDown={index === section.content.items.length - 1} />
          <button className="admin-icon-button admin-icon-danger" type="button" onClick={() => { if (window.confirm("Hapus formasi ini?")) remove(item.id); }} aria-label="Hapus formasi" title="Hapus formasi" disabled={section.content.items.length === 1}><Trash2 size={17} /></button>
        </div>
      ))}
      <button className="admin-secondary-button" type="button" onClick={() => onChange({ ...section, content: { ...section.content, items: [...section.content.items, { id: `position-${crypto.randomUUID()}`, name: "" }] } })}><Plus size={16} /> Tambah formasi</button>
    </div>
  );
}

function FacilitiesFields({ section, onChange }: EditorProps & { section: Extract<CmsSection, { section_key: "facilities" }> }) {
  const updateText = (id: string, text: string) => onChange({ ...section, content: { ...section.content, items: section.content.items.map((item) => item.id === id ? { ...item, text } : item) } });
  const updatePresentation = (id: string, value: Partial<(typeof section.presentation.items)[number]>) => onChange({ ...section, presentation: { ...section.presentation, items: section.presentation.items.map((item) => item.id === id ? { ...item, ...value } : item) } });
  const move = (index: number, direction: -1 | 1) => {
    const items = [...section.content.items];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const [item] = items.splice(index, 1);
    items.splice(target, 0, item);
    const orderedIds = new Map(items.map((entry, itemIndex) => [entry.id, itemIndex]));
    onChange({ ...section, content: { ...section.content, items }, presentation: { ...section.presentation, items: [...section.presentation.items].sort((a, b) => orderedIds.get(a.id)! - orderedIds.get(b.id)!) } });
  };
  const remove = (id: string) => onChange({
    ...section,
    content: { ...section.content, items: section.content.items.filter((item) => item.id !== id) },
    presentation: { ...section.presentation, items: section.presentation.items.filter((item) => item.id !== id) },
  });

  return (
    <div className="admin-stack">
      <Field label="Judul bagian"><input maxLength={120} value={section.content.title} onChange={(event) => onChange({ ...section, content: { ...section.content, title: event.target.value } })} /></Field>
      {section.content.items.map((item, index) => {
        const presentation = section.presentation.items.find((entry) => entry.id === item.id)!;
        return (
          <div className="admin-item-editor" key={item.id}>
            <Field label={`Fasilitas ${index + 1}`}><textarea maxLength={2000} value={item.text} onChange={(event) => updateText(item.id, event.target.value)} /></Field>
            <Field label="Warna"><select value={presentation.tone} onChange={(event) => updatePresentation(item.id, { tone: event.target.value as typeof presentation.tone })}><option value="green">Hijau</option><option value="orange">Oranye</option></select></Field>
            <Field label="Posisi"><select value={presentation.group} onChange={(event) => updatePresentation(item.id, { group: event.target.value as typeof presentation.group })}><option value="left">Kiri</option><option value="right">Kanan</option><option value="center">Tengah</option></select></Field>
            <OrderButtons onUp={() => move(index, -1)} onDown={() => move(index, 1)} disabledDown={index === section.content.items.length - 1} />
            <button className="admin-icon-button admin-icon-danger" type="button" onClick={() => { if (window.confirm("Hapus fasilitas ini?")) remove(item.id); }} aria-label="Hapus fasilitas" title="Hapus fasilitas" disabled={section.content.items.length === 1}><Trash2 size={17} /></button>
          </div>
        );
      })}
      <button className="admin-secondary-button" type="button" onClick={() => {
        const id = `facility-${crypto.randomUUID()}`;
        onChange({ ...section, content: { ...section.content, items: [...section.content.items, { id, text: "" }] }, presentation: { ...section.presentation, items: [...section.presentation.items, { id, tone: "green", group: "left" }] } });
      }}><Plus size={16} /> Tambah fasilitas</button>
    </div>
  );
}

function ContactFields({ section, onChange }: EditorProps & { section: Extract<CmsSection, { section_key: "contact" }> }) {
  const update = (key: keyof typeof section.content, value: string) => onChange({ ...section, content: { ...section.content, [key]: value } });
  return (
    <div className="admin-grid">
      <Field label="Judul"><input maxLength={120} value={section.content.title} onChange={(event) => update("title", event.target.value)} /></Field>
      <Field label="Nomor WhatsApp"><input maxLength={32} value={section.content.phoneNumber} onChange={(event) => update("phoneNumber", event.target.value)} /></Field>
      <Field label="Tautan WhatsApp"><input type="url" maxLength={2000} value={section.content.whatsappUrl} onChange={(event) => update("whatsappUrl", event.target.value)} /></Field>
      <Field label="Tautan pendaftaran"><input type="url" maxLength={2000} value={section.content.registrationUrl} onChange={(event) => update("registrationUrl", event.target.value)} /></Field>
      <Field label="Teks tombol pendaftaran"><input maxLength={80} value={section.content.registrationButtonText} onChange={(event) => update("registrationButtonText", event.target.value)} /></Field>
      <Field label="Attribution"><input maxLength={160} value={section.content.attribution} onChange={(event) => update("attribution", event.target.value)} /></Field>
    </div>
  );
}

export function SectionEditor({ initialSection, title }: { initialSection: CmsSection; title: string }) {
  const [section, setSection] = useState(initialSection);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const onChange = (updated: CmsSection) => {
    setSection(updated);
    setNotice(null);
  };

  function save() {
    startTransition(async () => setNotice(await saveSection(section)));
  }

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-eyebrow">Konten website</p>
        <h1>{title}</h1>
        <p>Perubahan akan tampil di website setelah berhasil disimpan.</p>
      </header>
      <section className="admin-panel admin-stack">
        {section.section_key !== "hero" && section.section_key !== "contact" ? (
          <label className="admin-visibility-control">
            <input type="checkbox" checked={section.is_visible} onChange={(event) => onChange({ ...section, is_visible: event.target.checked })} />
            {section.is_visible ? <Eye size={17} /> : <EyeOff size={17} />}
            Tampilkan bagian ini di website
          </label>
        ) : null}
        <Field label="Urutan tampil"><input type="number" min={0} max={1000} step={1} value={section.sort_order} onChange={(event) => onChange({ ...section, sort_order: Number(event.target.value) })} /></Field>
        {section.section_key === "hero" ? <HeroFields section={section} onChange={onChange} /> : null}
        {section.section_key === "requirements" ? <RequirementsFields section={section} onChange={onChange} /> : null}
        {section.section_key === "internship_positions" ? <PositionFields section={section} onChange={onChange} /> : null}
        {section.section_key === "facilities" ? <FacilitiesFields section={section} onChange={onChange} /> : null}
        {section.section_key === "contact" ? <ContactFields section={section} onChange={onChange} /> : null}
        <div className="admin-actions">
          <button className="admin-primary-button" type="button" onClick={save} disabled={pending}><Save size={16} /> {pending ? "Menyimpan..." : "Simpan perubahan"}</button>
          <a className="admin-secondary-button admin-inline-link" href="/" target="_blank" rel="noreferrer">Lihat website</a>
          {notice ? <span className={notice.ok ? "admin-notice-success" : "admin-notice-error"} role="status">{notice.message}</span> : null}
        </div>
      </section>
    </>
  );
}