import { Contact } from "@/components/sections/Contact";
import { Facilities } from "@/components/sections/Facilities";
import { Hero } from "@/components/sections/Hero";
import { InternshipPositions } from "@/components/sections/InternshipPositions";
import { Requirements } from "@/components/sections/Requirements";
import { getSiteContent } from "@/lib/cms/reader";
import { getPublicDesignStyle } from "@/lib/cms/design-style";
import type { SiteContent, SiteSectionKey } from "@/lib/cms/types";

export const dynamic = "force-dynamic";

function renderSection(key: SiteSectionKey, content: SiteContent) {
  switch (key) {
    case "hero":
      return <Hero key={key} data={content.hero} />;
    case "requirements":
      return <Requirements key={key} data={content.requirements} />;
    case "internship_positions":
      return <InternshipPositions key={key} data={content.positions} />;
    case "facilities":
      return <Facilities key={key} data={content.facilities} />;
    case "contact":
      return <Contact key={key} data={content.contact} />;
  }
}

export default async function HomePage() {
  const site = await getSiteContent();

  return (
    <main className="public-site" style={getPublicDesignStyle(site.settings.designTokens)}>
      {site.visibleSections.map((key) => renderSection(key, site.content))}
    </main>
  );
}
