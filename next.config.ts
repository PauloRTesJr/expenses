import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  i18n: {
    locales: ["pt-BR", "en-US"],
    defaultLocale: "pt-BR",
  },
  images: {
    remotePatterns: [new URL("https://*/**")],
  },
};

export default nextConfig;
