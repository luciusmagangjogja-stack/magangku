import type {
  LocalSiteImage,
  SiteContent,
  SiteImageKey,
  SitePageData,
  SiteSettings,
} from "../lib/cms/types";
import { siteImageKeys } from "../lib/cms/types";

export type {
  ContactContent,
  FacilitiesContent,
  HeroContent,
  ListSectionContent,
  RequirementIcon,
  RequirementsContent,
  SiteContent,
} from "../lib/cms/types";

export const localSiteImages: Record<SiteImageKey, LocalSiteImage> = {
  hero_image: {
    label: "Ilustrasi utama Magangku",
    localFallbackPath: "/images/background-magangku.png",
    altText: "Ilustrasi peserta magang sedang bekerja bersama di meja",
    mimeType: "image/png",
    fileSize: 44685,
    width: 1106,
    height: 1272,
  },
  hero_background: {
    label: "Latar bagian pembuka",
    localFallbackPath: "/images/bg-soft-magangku.png",
    altText: "",
    mimeType: "image/png",
    fileSize: 9883,
    width: 1600,
    height: 770,
  },
  people_banner: {
    label: "Ilustrasi peserta magang",
    localFallbackPath: "/images/bg-peoples-magangku.png",
    altText: "",
    mimeType: "image/png",
    fileSize: 49692,
    width: 1600,
    height: 780,
  },
  facilities_illustration: {
    label: "Ilustrasi fasilitas magang",
    localFallbackPath: "/images/rocket-laptop-speed.png",
    altText: "",
    mimeType: "image/png",
    fileSize: 35380,
    width: 1600,
    height: 623,
  },
  contact_background: {
    label: "Latar informasi kontak",
    localFallbackPath: "/images/cloud-784900.png",
    altText: "",
    mimeType: "image/png",
    fileSize: 17115,
    width: 1600,
    height: 728,
  },
  registration_image: {
    label: "Tombol formulir pendaftaran",
    localFallbackPath: "/images/daftar.png",
    altText: "Form pendaftaran",
    mimeType: "image/png",
    fileSize: 14850,
    width: 200,
    height: 56,
  },
  badge_image: {
    label: "Badge program tanpa biaya",
    localFallbackPath: "/images/tanpa-biaya-721586.png",
    altText: "Program magang 100% tanpa biaya",
    mimeType: "image/png",
    fileSize: 5303,
    width: 290,
    height: 289,
  },
};

export const siteSettings: SiteSettings = {
  siteTitle: "Magangku | Magang Online",
  seoDescription:
    "Informasi magang online Magangku untuk siswa SMK dan mahasiswa. Lihat syarat, formasi, fasilitas, dan informasi pendaftaran.",
  designTokens: {
    colors: {
      primary: "#f8921d",
      secondary: "#3dbe71",
      accent: "#fff0df",
      background: "#ffffff",
      surface: "#f7fffa",
      text: "#444444",
      muted: "#606062",
      border: "#444444",
    },
    typography: {
      fontFamily: "hey-comic",
      baseSize: 16,
      headingSize: 48,
      paragraphSize: 15,
      lineHeight: 1.5,
    },
    layout: {
      contentWidth: 1140,
      sectionPadding: 24,
      elementSpacing: 20,
    },
    shape: {
      borderRadius: 12,
      buttonRadius: 12,
      cardRadius: 12,
    },
  },
};

export const siteContent: SiteContent = {
  hero: {
    titleLines: ["Ayo Magang", "di sini!"],
    paragraphs: [
      "Kamu siswa SMK / Mahasiswa? Cari tempat PKL, Magang, Prakerin, OJT atau Praktik Kerja secara basic online? Pas banget ini!",
      "Dimasa pandemi ini, kamu tetap bisa magang loh! Mau tau lebih lanjut? Yuk simak dibawah ini.",
    ],
    image: {
      src: localSiteImages.hero_image.localFallbackPath,
      alt: localSiteImages.hero_image.altText,
    },
    backgroundImage: localSiteImages.hero_background.localFallbackPath,
    peopleBannerImage: localSiteImages.people_banner.localFallbackPath,
  },
  requirements: {
    title: "Syarat & Ketentuan",
    items: [
      { id: "requirement-internet", text: "Memiliki Koneksi Internet Sendiri", icon: "wifi", tone: "green" },
      { id: "requirement-registration", text: "Daftarkan diri melalui WA magangku.com", icon: "document", tone: "orange" },
      {
        id: "requirement-letter",
        text: "Mengumpulkan surat pengantar dari kampus/ sekolah melalui email",
        icon: "mail",
        tone: "green",
      },
      {
        id: "requirement-motivation",
        text: "Memiliki Niat positif mencari skill & pengalaman selama magang berjalan",
        icon: "sparkles",
        tone: "green",
      },
      {
        id: "requirement-independence",
        text: "Mau latihan hidup mandiri. Jadi lulus dari magang sudah siap hidup mandiri",
        icon: "book",
        tone: "orange",
      },
      {
        id: "requirement-responsibility",
        text: "Mau menjaga baik nama perusahaan, kampus/ sekolah dan diri sendiri",
        icon: "shield",
        tone: "green",
      },
    ],
  },
  positions: {
    title: "Formasi Magang Online Untuk Kamu",
    items: [
      { id: "position-ui-ux-designer", name: "UI/UX Designer" },
      { id: "position-seo", name: "SEO" },
      { id: "position-human-resource", name: "Human Resource" },
      { id: "position-social-media-specialist", name: "Social Media Specialist" },
      { id: "position-photo-video-editor", name: "Editor Foto / Editor Video" },
      { id: "position-content-writer", name: "Content Writer" },
      { id: "position-digital-marketing", name: "Digital Marketing" },
      { id: "position-graphic-designer", name: "Desaigner Grafis" },
      { id: "position-content-planner", name: "Content Planer" },
      { id: "position-tiktok-creator", name: "Tiktok Creator" },
      { id: "position-public-relations", name: "Marcomm / Public Relation" },
    ],
  },
  facilities: {
    title: "Fasilitas Yang didapat",
    backgroundImage: localSiteImages.facilities_illustration.localFallbackPath,
    items: [
      {
        id: "facility-guidance",
        text: "Bimbingan dari asisten/staf kami 24 jam",
        tone: "orange",
        group: "left",
      },
      {
        id: "facility-recommendation",
        text: "Mendapat Surat rekomendasi yang akan dikirim ke alamat rumah",
        tone: "green",
        group: "left",
      },
      {
        id: "facility-certificate",
        text: "Mendapat sertifikat yang akan dikirim ke alamat rumah(bukan e-Sertifikat)",
        tone: "green",
        group: "right",
      },
      {
        id: "facility-recruitment",
        text: "Berkesempatan di rekrut menjadi bagian TIM perusahaan",
        tone: "orange",
        group: "right",
      },
      {
        id: "facility-lifetime-consultation",
        text: "Konsultasi Free Lifetime setelah magang selesai",
        tone: "green",
        group: "center",
      },
    ],
  },
  contact: {
    title: "More info",
    phoneNumber: "0818 1818 1013",
    whatsappUrl: "https://wa.link/y23pe4",
    registrationUrl: "http://bit.ly/form_magangku",
    registrationButtonText: "FORM PENDAFTARAN",
    registrationImage: {
      src: localSiteImages.registration_image.localFallbackPath,
      alt: localSiteImages.registration_image.altText,
    },
    attribution: "powered by www.Republikweb.net",
    badgeImage: {
      src: localSiteImages.badge_image.localFallbackPath,
      alt: localSiteImages.badge_image.altText,
    },
    backgroundImage: localSiteImages.contact_background.localFallbackPath,
  },
};

export const localSitePageData: SitePageData = {
  settings: siteSettings,
  content: siteContent,
  visibleSections: ["hero", "requirements", "internship_positions", "facilities", "contact"],
  images: siteImageKeys.map((key) => {
    const image = localSiteImages[key];
    return {
      key,
      label: image.label,
      src: image.localFallbackPath,
      storagePath: null,
      localFallbackPath: image.localFallbackPath,
      altText: image.altText,
      mimeType: image.mimeType,
      fileSize: image.fileSize,
      width: image.width,
      height: image.height,
    };
  }),
};
