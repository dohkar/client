import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/constants";
import { getSiteUrl } from "@/lib/seo";
import { PWA_BACKGROUND_COLOR, PWA_THEME_COLOR } from "@/constants/pwa";

export default function manifest(): MetadataRoute.Manifest {
  const base = getSiteUrl().replace(/\/$/, "");

  return {
    id: `${base}/`,
    name: APP_CONFIG.name,
    short_name: APP_CONFIG.name,
    description: APP_CONFIG.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    lang: "ru",
    dir: "ltr",
    categories: ["business", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
