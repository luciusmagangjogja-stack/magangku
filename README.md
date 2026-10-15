# Magangku

Website publik Magangku memakai Next.js App Router. Konten Supabase divalidasi dengan Zod dan ditampilkan melalui komponen section yang sudah ada. Jika Supabase tidak tersedia atau datanya tidak valid, website publik memakai fallback `data/site.ts`. `index.html` serta direktori `assets/` arsip tidak diubah.

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Tanpa konfigurasi Supabase, website publik memakai data lokal; area admin meminta koneksi Supabase.

Runtime memakai `.env.local` (diabaikan Git):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Jangan menambahkan service-role key atau secret ke client, `NEXT_PUBLIC_*`, atau repository.

## Admin

Login tersedia di `/admin/login`. Owner/editor aktif di `admin_profiles` dapat mengelola lima section yang ada, tampilan berbasis design token, tujuh slot gambar, dan riwayat perubahan. Hanya owner yang dapat mengelola akses admin. Login memakai Supabase Auth; profil aktif menentukan authorization. User/password dibuat melalui Supabase Auth, bukan CMS.

Untuk bootstrap owner pertama, lihat [panduan Supabase](supabase/README.md). Setelah owner aktif, buat identity Auth melalui Supabase Auth; owner memberi role melalui **Pengelolaan admin**.

## Supabase lokal

CLI tidak dipasang global. Tambahkan sebagai dependency project lalu jalankan stack lokal:

```bash
npm install --save-dev supabase
npx supabase start
```

Salin `.env.example` menjadi `.env.local`, lalu isi URL dan publishable key lokal dari output CLI. Untuk database lokal disposable saja:

```bash
npx supabase db reset
```

Perintah tersebut menghapus dan membangun ulang database lokal, menerapkan semua migration, lalu menjalankan seed. Jangan jalankan `db reset` pada project hosted. Migrasi hosted memerlukan verifikasi project, backup, dan persetujuan deployment.

## Pemeriksaan

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

`npm test` menjalankan test lokal dan live test Supabase; live test akan skip bila environment belum lengkap. Untuk live test, siapkan project disposable berisi seed, akun editor, satu owner aktif, dan akun non-admin. Set URL/key runtime, `SUPABASE_TEST_EDITOR_EMAIL`, `SUPABASE_TEST_EDITOR_PASSWORD`, `SUPABASE_TEST_OWNER_EMAIL`, `SUPABASE_TEST_OWNER_PASSWORD`, `SUPABASE_TEST_NONADMIN_EMAIL`, `SUPABASE_TEST_NONADMIN_PASSWORD`, dan `SUPABASE_TEST_DISPOSABLE=1`, lalu jalankan `npm run test:integration`.

Test live mengubah sementara visibility section, menambah audit rows, dan mengunggah object sementara. Gunakan hanya database disposable, bukan production credentials. Simpan secret di environment lokal/CI terlindungi, bukan source atau `.env.example`.

Untuk pemeriksaan visual responsif, pasang Chromium dengan `npx playwright install chromium`, jalankan server, lalu jalankan `npm run test:responsive` di terminal lain. Tes memeriksa desktop, tablet, dan ponsel.

## Gambar

Bucket `site-media` dibuat migration. Editor/owner dapat mengganti gambar JPEG, PNG, atau WebP sampai 5 MiB. Path object selalu baru; server memeriksa byte, dimensi, MIME, ukuran, dan kemampuan decode. Hapus unggahan mengembalikan slot ke fallback lokal.

## Deploy ke Vercel

1. Atur `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` di Vercel Project Settings.
2. Terapkan migration ke project yang diverifikasi dan memiliki backup. Jangan gunakan `supabase db reset` pada hosted project.
3. Pastikan kebijakan Auth, owner aktif, RLS, dan Storage sudah benar.
4. Jalankan test, lint, typecheck, dan production build.

Tanpa Supabase, halaman publik tetap memakai fallback lokal, tetapi login/CMS tidak tersedia. Build tidak membuktikan RLS/Auth/Storage hosted.

## Aset migrasi

Font Hey Comic dan gambar website tersedia di `public/`. Gambar dekoratif lama disalin ke `public/images/` agar website tidak bergantung pada host eksternal. Sumber yang diberikan tidak memiliki favicon.
