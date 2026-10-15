"use client";

import Image from "next/image";
import { Save, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { removeSiteImage, saveImageMetadata, saveUploadedImageMetadata } from "../../actions";
import { inspectImageUpload } from "@/lib/cms/image-upload";
import type { CmsImageRow } from "@/lib/cms/schemas";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ImageView = CmsImageRow & { src: string };

function formatBytes(size: number) {
  return `${(size / (1024 * 1024)).toFixed(2)} MiB`;
}

function ImageSlot({ image }: { image: ImageView }) {
  const [label, setLabel] = useState(image.label);
  const [altText, setAltText] = useState(image.alt_text);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const fileForm = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function saveMetadata() {
    startTransition(async () => {
      const result = await saveImageMetadata({ image_key: image.image_key, label, alt_text: altText });
      setNotice(result);
      if (result.ok) router.refresh();
    });
  }

  function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("file");
    if (!(file instanceof File) || !file.size) {
      setNotice({ ok: false, message: "Pilih gambar yang akan diunggah." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ ok: false, message: "Ukuran gambar maksimal 5 MiB." });
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setNotice({ ok: false, message: "Pilih file JPEG, PNG, atau WebP." });
      return;
    }

    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      let inspected;
      try {
        inspected = await inspectImageUpload(file);
      } catch (error) {
        setNotice({ ok: false, message: error instanceof Error ? error.message : "File gambar tidak dapat digunakan." });
        return;
      }

      let supabase;
      try {
        supabase = createSupabaseBrowserClient();
      } catch {
        setNotice({ ok: false, message: "Koneksi Supabase belum tersedia." });
        return;
      }

      const storagePath = `${image.image_key}/${crypto.randomUUID()}.${inspected.extension}`;
      const { error: uploadError } = await supabase.storage.from("site-media").upload(storagePath, file, {
        cacheControl: "31536000",
        contentType: inspected.mimeType,
        upsert: false,
      });
      if (uploadError) {
        setNotice({ ok: false, message: "Gambar belum berhasil diunggah. Periksa akses Storage, lalu coba lagi." });
        return;
      }

      const result = await saveUploadedImageMetadata({
        image_key: image.image_key,
        label: String(formData.get("label") ?? ""),
        alt_text: String(formData.get("alt_text") ?? ""),
        storage_path: storagePath,
        mime_type: inspected.mimeType,
        file_size: inspected.fileSize,
        width: inspected.width,
        height: inspected.height,
      });
      if (!result.ok) {
        await supabase.storage.from("site-media").remove([storagePath]);
      } else {
        router.refresh();
      }
      setNotice(result);
      if (result.ok) fileForm.current?.reset();
    });
  }

  function removeImage() {
    if (!window.confirm("Hapus gambar unggahan dan gunakan gambar bawaan?")) return;
    startTransition(async () => {
      const result = await removeSiteImage(image.image_key);
      setNotice(result);
      if (result.ok) router.refresh();
    });
  }

  return (
    <article className="admin-image-slot">
      <div>
        <Image className="admin-image-preview" src={image.src} alt={altText || label} width={image.width} height={image.height} unoptimized />
        <p className="admin-image-facts">
          {image.storage_path ? "Gambar unggahan" : "Gambar bawaan"} · {image.mime_type.replace("image/", "").toUpperCase()} · {formatBytes(image.file_size)} · {image.width} × {image.height}
        </p>
      </div>
      <div className="admin-stack">
        <h2>{label}</h2>
        <form className="admin-stack" onSubmit={(event) => { event.preventDefault(); saveMetadata(); }}>
          <label className="admin-field">Nama gambar
            <input required maxLength={120} value={label} onChange={(event) => setLabel(event.target.value)} />
          </label>
          <label className="admin-field">Teks alternatif
            <input maxLength={500} value={altText} onChange={(event) => setAltText(event.target.value)} />
          </label>
          <button className="admin-secondary-button" type="submit" disabled={pending}><Save size={16} /> Simpan informasi</button>
        </form>
        <form ref={fileForm} className="admin-upload-form" onSubmit={upload}>
          <input type="hidden" name="image_key" value={image.image_key} />
          <input type="hidden" name="label" value={label} />
          <input type="hidden" name="alt_text" value={altText} />
          <label className="admin-field">Pilih gambar
            <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
          </label>
          <div className="admin-actions">
            <button className="admin-primary-button" type="submit" disabled={pending}><Upload size={16} /> {pending ? "Memproses..." : "Unggah dan ganti"}</button>
            {image.storage_path ? <button className="admin-danger-button" type="button" onClick={removeImage} disabled={pending}><Trash2 size={16} /> Hapus unggahan</button> : null}
          </div>
        </form>
        {notice ? <p className={notice.ok ? "admin-notice-success" : "admin-notice-error"} role="status">{notice.message}</p> : null}
      </div>
    </article>
  );
}

export function ImageManager({ images }: { images: ImageView[] }) {
  return (
    <>
      <header className="admin-page-header">
        <p className="admin-eyebrow">Media website</p>
        <h1>Gambar website</h1>
        <p>Gambar lama tidak ditimpa. Setiap penggantian memakai file baru dan memperbarui slot terkait.</p>
      </header>
      <div className="admin-image-list">
        {images.map((image) => <ImageSlot key={`${image.image_key}:${image.storage_path ?? "local"}:${image.label}:${image.alt_text}`} image={image} />)}
      </div>
    </>
  );
}