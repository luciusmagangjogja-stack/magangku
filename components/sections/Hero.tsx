import Image from "next/image";
import type { HeroContent } from "@/data/site";

export function Hero({ data }: { data: HeroContent }) {
  return (
    <>
      <section
        className="hero-section"
        aria-labelledby="hero-title"
        style={{ backgroundImage: `url("${data.backgroundImage}")` }}
      >
        <div className="content-shell hero-grid mx-auto grid w-full max-w-[1140px] items-center px-5">
          <div className="hero-copy">
            <h1 id="hero-title" className="hero-title">
              {data.titleLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h1>
            {data.paragraphs.map((paragraph) => (
              <p className="hero-paragraph" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
          <Image
            className="hero-image"
            src={data.image.src}
            alt={data.image.alt}
            width={1106}
            height={1272}
            priority
            sizes="(max-width: 767px) 72vw, 340px"
          />
        </div>
      </section>
      <div
        className="people-banner"
        aria-hidden="true"
        style={{ backgroundImage: `url("${data.peopleBannerImage}")` }}
      />
    </>
  );
}
