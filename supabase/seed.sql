insert into public.site_settings (singleton, site_title, seo_description, design_tokens)
values (
  true,
  'Magangku | Magang Online',
  'Informasi magang online Magangku untuk siswa SMK dan mahasiswa. Lihat syarat, formasi, fasilitas, dan informasi pendaftaran.',
  '{
    "colors": {
      "primary": "#f8921d",
      "secondary": "#3dbe71",
      "accent": "#fff0df",
      "background": "#ffffff",
      "surface": "#f7fffa",
      "text": "#444444",
      "muted": "#606062",
      "border": "#444444"
    },
    "typography": {
      "fontFamily": "hey-comic",
      "baseSize": 16,
      "headingSize": 48,
      "paragraphSize": 15,
      "lineHeight": 1.5
    },
    "layout": {
      "contentWidth": 1140,
      "sectionPadding": 24,
      "elementSpacing": 20
    },
    "shape": {
      "borderRadius": 12,
      "buttonRadius": 12,
      "cardRadius": 12
    }
  }'::jsonb
)
on conflict (singleton) do update set
  site_title = excluded.site_title,
  seo_description = excluded.seo_description,
  design_tokens = excluded.design_tokens;

insert into public.site_sections (section_key, is_visible, sort_order, content, presentation)
values
(
  'hero', true, 0,
  '{
    "titleLines": ["Ayo Magang", "di sini!"],
    "paragraphs": [
      "Kamu siswa SMK / Mahasiswa? Cari tempat PKL, Magang, Prakerin, OJT atau Praktik Kerja secara basic online? Pas banget ini!",
      "Dimasa pandemi ini, kamu tetap bisa magang loh! Mau tau lebih lanjut? Yuk simak dibawah ini."
    ]
  }'::jsonb,
  '{"imageKey":"hero_image","backgroundImageKey":"hero_background","peopleBannerImageKey":"people_banner"}'::jsonb
),
(
  'requirements', true, 1,
  '{
    "title":"Syarat & Ketentuan",
    "items":[
      {"id":"requirement-internet","text":"Memiliki Koneksi Internet Sendiri"},
      {"id":"requirement-registration","text":"Daftarkan diri melalui WA magangku.com"},
      {"id":"requirement-letter","text":"Mengumpulkan surat pengantar dari kampus/ sekolah melalui email"},
      {"id":"requirement-motivation","text":"Memiliki Niat positif mencari skill & pengalaman selama magang berjalan"},
      {"id":"requirement-independence","text":"Mau latihan hidup mandiri. Jadi lulus dari magang sudah siap hidup mandiri"},
      {"id":"requirement-responsibility","text":"Mau menjaga baik nama perusahaan, kampus/ sekolah dan diri sendiri"}
    ]
  }'::jsonb,
  '{
    "items":[
      {"id":"requirement-internet","icon":"wifi","tone":"green"},
      {"id":"requirement-registration","icon":"document","tone":"orange"},
      {"id":"requirement-letter","icon":"mail","tone":"green"},
      {"id":"requirement-motivation","icon":"sparkles","tone":"green"},
      {"id":"requirement-independence","icon":"book","tone":"orange"},
      {"id":"requirement-responsibility","icon":"shield","tone":"green"}
    ]
  }'::jsonb
),
(
  'internship_positions', true, 2,
  '{
    "title":"Formasi Magang Online Untuk Kamu",
    "items":[
      {"id":"position-ui-ux-designer","name":"UI/UX Designer"},
      {"id":"position-seo","name":"SEO"},
      {"id":"position-human-resource","name":"Human Resource"},
      {"id":"position-social-media-specialist","name":"Social Media Specialist"},
      {"id":"position-photo-video-editor","name":"Editor Foto / Editor Video"},
      {"id":"position-content-writer","name":"Content Writer"},
      {"id":"position-digital-marketing","name":"Digital Marketing"},
      {"id":"position-graphic-designer","name":"Desaigner Grafis"},
      {"id":"position-content-planner","name":"Content Planer"},
      {"id":"position-tiktok-creator","name":"Tiktok Creator"},
      {"id":"position-public-relations","name":"Marcomm / Public Relation"}
    ]
  }'::jsonb,
  '{}'::jsonb
),
(
  'facilities', true, 3,
  '{
    "title":"Fasilitas Yang didapat",
    "items":[
      {"id":"facility-guidance","text":"Bimbingan dari asisten/staf kami 24 jam"},
      {"id":"facility-recommendation","text":"Mendapat Surat rekomendasi yang akan dikirim ke alamat rumah"},
      {"id":"facility-certificate","text":"Mendapat sertifikat yang akan dikirim ke alamat rumah(bukan e-Sertifikat)"},
      {"id":"facility-recruitment","text":"Berkesempatan di rekrut menjadi bagian TIM perusahaan"},
      {"id":"facility-lifetime-consultation","text":"Konsultasi Free Lifetime setelah magang selesai"}
    ]
  }'::jsonb,
  '{
    "backgroundImageKey":"facilities_illustration",
    "items":[
      {"id":"facility-guidance","tone":"orange","group":"left"},
      {"id":"facility-recommendation","tone":"green","group":"left"},
      {"id":"facility-certificate","tone":"green","group":"right"},
      {"id":"facility-recruitment","tone":"orange","group":"right"},
      {"id":"facility-lifetime-consultation","tone":"green","group":"center"}
    ]
  }'::jsonb
),
(
  'contact', true, 4,
  '{
    "title":"More info",
    "phoneNumber":"0818 1818 1013",
    "whatsappUrl":"https://wa.link/y23pe4",
    "registrationUrl":"http://bit.ly/form_magangku",
    "registrationButtonText":"FORM PENDAFTARAN",
    "attribution":"powered by www.Republikweb.net"
  }'::jsonb,
  '{
    "backgroundImageKey":"contact_background",
    "registrationImageKey":"registration_image",
    "badgeImageKey":"badge_image"
  }'::jsonb
)
on conflict (section_key) do update set
  is_visible = excluded.is_visible,
  sort_order = excluded.sort_order,
  content = excluded.content,
  presentation = excluded.presentation;

insert into public.site_images (
  image_key, label, storage_path, local_fallback_path, alt_text, mime_type, file_size, width, height
)
values
  ('hero_image', 'Ilustrasi utama Magangku', null, '/images/background-magangku.png', 'Ilustrasi peserta magang sedang bekerja bersama di meja', 'image/png', 44685, 1106, 1272),
  ('hero_background', 'Latar bagian pembuka', null, '/images/bg-soft-magangku.png', '', 'image/png', 9883, 1600, 770),
  ('people_banner', 'Ilustrasi peserta magang', null, '/images/bg-peoples-magangku.png', '', 'image/png', 49692, 1600, 780),
  ('facilities_illustration', 'Ilustrasi fasilitas magang', null, '/images/rocket-laptop-speed.png', '', 'image/png', 35380, 1600, 623),
  ('contact_background', 'Latar informasi kontak', null, '/images/cloud-784900.png', '', 'image/png', 17115, 1600, 728),
  ('registration_image', 'Tombol formulir pendaftaran', null, '/images/daftar.png', 'Form pendaftaran', 'image/png', 14850, 200, 56),
  ('badge_image', 'Badge program tanpa biaya', null, '/images/tanpa-biaya-721586.png', 'Program magang 100% tanpa biaya', 'image/png', 5303, 290, 289)
on conflict (image_key) do update set
  label = excluded.label,
  storage_path = excluded.storage_path,
  local_fallback_path = excluded.local_fallback_path,
  alt_text = excluded.alt_text,
  mime_type = excluded.mime_type,
  file_size = excluded.file_size,
  width = excluded.width,
  height = excluded.height;
