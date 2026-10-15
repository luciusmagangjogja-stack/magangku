"use client";

import { Save } from "lucide-react";
import { useState, useTransition } from "react";
import { saveDesignTokens } from "../../actions";
import type { DesignTokens } from "@/lib/cms/types";

const colors: { key: keyof DesignTokens["colors"]; label: string }[] = [
  { key: "primary", label: "Warna utama" },
  { key: "secondary", label: "Warna sekunder" },
  { key: "accent", label: "Warna aksen" },
  { key: "background", label: "Latar website" },
  { key: "surface", label: "Latar bagian" },
  { key: "text", label: "Warna teks" },
  { key: "muted", label: "Teks pendukung" },
  { key: "border", label: "Garis tepi" },
];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="admin-field admin-color-field">
      {label}
      <span className="admin-color-inputs">
        <input aria-label={`${label} pilih warna`} type="color" value={/^#[\da-f]{6}$/i.test(value) ? value : "#ffffff"} onChange={(event) => onChange(event.target.value)} />
        <input aria-label={`${label} kode warna`} type="text" inputMode="text" pattern="#[\da-fA-F]{6}" maxLength={7} value={value} onChange={(event) => onChange(event.target.value)} />
      </span>
    </label>
  );
}

function NumberField({ label, value, min, max, step, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="admin-field">
      {label}
      <input type="number" required min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.valueAsNumber)} />
    </label>
  );
}

export function DesignEditor({ initialTokens }: { initialTokens: DesignTokens }) {
  const [tokens, setTokens] = useState(initialTokens);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);

  function save() {
    startTransition(async () => setNotice(await saveDesignTokens(tokens)));
  }

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-eyebrow">Tampilan website</p>
        <h1>Warna, teks, dan jarak</h1>
        <p>Gunakan kontrol yang tersedia. Susunan dan breakpoint tetap dijaga oleh website.</p>
      </header>
      <div className="admin-stack">
        <section className="admin-panel">
          <h2>Warna</h2>
          <div className="admin-grid">
            {colors.map(({ key, label }) => (
              <ColorField key={key} label={label} value={tokens.colors[key]} onChange={(value) => { setTokens((current) => ({ ...current, colors: { ...current.colors, [key]: value } })); setNotice(null); }} />
            ))}
          </div>
        </section>
        <section className="admin-panel">
          <h2>Teks</h2>
          <div className="admin-grid">
            <label className="admin-field">Jenis huruf
              <select value={tokens.typography.fontFamily} onChange={(event) => setTokens((current) => ({ ...current, typography: { ...current.typography, fontFamily: event.target.value as DesignTokens["typography"]["fontFamily"] } }))}>
                <option value="hey-comic">Hey Comic</option>
                <option value="system-sans">Sans-serif</option>
              </select>
            </label>
            <NumberField label="Ukuran teks dasar (px)" value={tokens.typography.baseSize} min={12} max={24} step={1} onChange={(value) => setTokens((current) => ({ ...current, typography: { ...current.typography, baseSize: value } }))} />
            <NumberField label="Ukuran judul (px)" value={tokens.typography.headingSize} min={24} max={56} step={1} onChange={(value) => setTokens((current) => ({ ...current, typography: { ...current.typography, headingSize: value } }))} />
            <NumberField label="Ukuran paragraf (px)" value={tokens.typography.paragraphSize} min={12} max={24} step={1} onChange={(value) => setTokens((current) => ({ ...current, typography: { ...current.typography, paragraphSize: value } }))} />
            <NumberField label="Jarak antarbaris" value={tokens.typography.lineHeight} min={1} max={2} step={0.1} onChange={(value) => setTokens((current) => ({ ...current, typography: { ...current.typography, lineHeight: value } }))} />
          </div>
        </section>
        <section className="admin-panel">
          <h2>Ukuran dan jarak</h2>
          <div className="admin-grid">
            <NumberField label="Lebar konten (px)" value={tokens.layout.contentWidth} min={640} max={1440} step={20} onChange={(value) => setTokens((current) => ({ ...current, layout: { ...current.layout, contentWidth: value } }))} />
            <NumberField label="Jarak tepi bagian (px)" value={tokens.layout.sectionPadding} min={0} max={200} step={4} onChange={(value) => setTokens((current) => ({ ...current, layout: { ...current.layout, sectionPadding: value } }))} />
            <NumberField label="Jarak antar elemen (px)" value={tokens.layout.elementSpacing} min={0} max={80} step={2} onChange={(value) => setTokens((current) => ({ ...current, layout: { ...current.layout, elementSpacing: value } }))} />
            <NumberField label="Lengkung sudut (px)" value={tokens.shape.borderRadius} min={0} max={32} step={1} onChange={(value) => setTokens((current) => ({ ...current, shape: { ...current.shape, borderRadius: value } }))} />
            <NumberField label="Lengkung tombol (px)" value={tokens.shape.buttonRadius} min={0} max={32} step={1} onChange={(value) => setTokens((current) => ({ ...current, shape: { ...current.shape, buttonRadius: value } }))} />
            <NumberField label="Lengkung kartu (px)" value={tokens.shape.cardRadius} min={0} max={32} step={1} onChange={(value) => setTokens((current) => ({ ...current, shape: { ...current.shape, cardRadius: value } }))} />
          </div>
        </section>
        <div className="admin-actions">
          <button className="admin-primary-button" type="button" onClick={save} disabled={pending}><Save size={16} /> {pending ? "Menyimpan..." : "Simpan tampilan"}</button>
          {notice ? <span className={notice.ok ? "admin-notice-success" : "admin-notice-error"} role="status">{notice.message}</span> : null}
        </div>
      </div>
    </>
  );
}