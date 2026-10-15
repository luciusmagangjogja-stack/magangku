import type { NextConfig } from "next";

const supabaseImagePatterns = (() => {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) return [];

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.pathname !== "/") return [];

    return [
      {
        protocol: url.protocol.slice(0, -1) as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/storage/v1/object/public/site-media/**",
      },
    ];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseImagePatterns,
  },
};

export default nextConfig;
