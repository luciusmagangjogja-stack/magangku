import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getSiteSettings } from "@/lib/cms/reader";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: settings.siteTitle,
    description: settings.seoDescription,
    openGraph: {
      title: settings.siteTitle,
      description: settings.seoDescription,
      locale: "id_ID",
      type: "website",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id-ID">
      <body>{children}</body>
    </html>
  );
}
