import Image from "next/image";
import type { ContactContent } from "@/data/site";

export function Contact({ data }: { data: ContactContent }) {
  return (
    <section
      className="contact-section"
      id="about"
      aria-labelledby="contact-title"
      style={{ backgroundImage: `url("${data.backgroundImage}")` }}
    >
      <div className="contact-content content-shell mx-auto w-full max-w-[1140px] px-5">
        <h2 className="contact-title" id="contact-title">
          {data.title}
        </h2>
        <a className="contact-phone" href={data.whatsappUrl}>
          {data.phoneNumber}
        </a>
        <p className="attribution">{data.attribution}</p>
        <a
          className="registration-link"
          href={data.registrationUrl}
          target="_blank"
          rel="nofollow noopener noreferrer"
          aria-label={`Daftar magang: ${data.registrationButtonText}`}
        >
          <Image
            src={data.registrationImage.src}
            alt={data.registrationImage.alt}
            width={200}
            height={56}
            sizes="200px"
          />
        </a>
      </div>
      <a className="floating-badge" href="#about" aria-label="Lihat informasi kontak Magangku">
        <Image
          src={data.badgeImage.src}
          alt={data.badgeImage.alt}
          width={290}
          height={289}
          sizes="(max-width: 767px) 84px, 160px"
        />
      </a>
    </section>
  );
}
