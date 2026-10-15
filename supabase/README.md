# Supabase Foundation

Migration pertama membuat tabel CMS, grants/RLS, audit trigger, dan bucket publik `site-media`. Migration kedua menambahkan RPC berizin untuk directory Auth, aktivitas, dan LOGIN/LOGOUT. `seed.sql` memasukkan konten Magangku yang sudah ada, lima section, dan tujuh slot fallback lokal.

## Database lokal

1. Pastikan Docker Desktop/container runtime tersedia.
2. Pasang CLI hanya pada project: `npm install --save-dev supabase`.
3. Mulai stack lokal dengan `npx supabase start`.
4. Salin `.env.example` ke `.env.local`; isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dari output CLI.
5. Jalankan `npx supabase db reset` **hanya** terhadap database lokal disposable. Perintah ini menerapkan migration dan seed serta menghapus data lokal sebelumnya.
6. Jalankan `npm run dev` dan buka `/admin/login` atau halaman publik.

Row seed yang diharapkan untuk database baru: `site_settings` 1, `site_sections` 5, `site_images` 7, `admin_profiles` 0, `activity_logs` 0. Angka berasal dari seed; bootstrap/login berikutnya menambah profil dan audit rows.

Jangan gunakan `db reset` untuk hosted project. Sebelum migrasi hosted, verifikasi project/ref, backup, rencana deployment, dan hasil uji lokal. Jangan menjalankan `db push --linked` tanpa review eksplisit.

## Bootstrap owner pertama

1. Nonaktifkan public sign-ups pada Auth project yang benar.
2. Buat user owner melalui Supabase Auth dashboard dan salin UUID user tersebut.
3. Di SQL Editor untuk project yang sama, sebagai database owner, jalankan:

```sql
insert into public.admin_profiles (user_id, role, is_active)
values ('AUTH_USER_UUID', 'owner', true);
```

4. Buka `/admin/login` dan masuk dengan email/password Auth tersebut.
5. Buat identity Auth lain melalui Supabase Auth; owner dapat memberi role dari **Pengelolaan admin**. Password tidak dikelola CMS.

Pastikan UUID/project cocok. Trigger mencegah demote/nonaktif/hapus owner aktif terakhir.

## Akses dan audit

- Browser/server memakai publishable key. Tidak ada service-role key di aplikasi.
- Authorization memerlukan verified Auth claims dan profil aktif di `admin_profiles`; `user_metadata` bukan sumber role.
- Public dapat membaca settings, section visible, dan metadata gambar publik. Mutasi content/design/image dibatasi ke owner/editor aktif melalui grants dan RLS.
- Profil admin hanya dapat dikelola owner. RPC directory Auth dan daftar akun yang belum diberi role juga owner-only.
- `activity_logs` tidak memberi client akses insert/update/delete. Trigger tabel dan fungsi auth ber-allowlist menulis actor dari `auth.uid()`; editor/owner aktif dapat membaca aktivitas.
- Bucket `site-media` public untuk delivery, menerima JPEG/PNG/WebP sampai 5 MiB, dan membolehkan upload/delete hanya untuk admin aktif. Object update tidak diberi policy; gambar diganti dengan path baru.
- Upload diperiksa signature, MIME, ukuran, dimensi, dan decoding. Jangan menerima SVG.
- Public reader memetakan payload valid ke komponen lama. Error/query/payload rusak menggunakan `data/site.ts`; detail database tidak ditampilkan kepada visitor.

## Test live

`npm run test:integration` hanya berjalan dengan URL/key, akun test editor, satu owner aktif, non-admin, dan `SUPABASE_TEST_DISPOSABLE=1`. Test melakukan mutasi terkendali, menambah audit rows, dan mengunggah object sementara; jalankan hanya pada project disposable. Jika environment tidak tersedia, test berstatus skip, bukan live verification lulus.
