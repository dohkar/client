import type { NextConfig } from "next";

import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  /* config options here */

  // Output для оптимального деплоя
  output: "standalone",

  // Оптимизация изображений
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Разрешаем любые внешние изображения (ВНИМАНИЕ: риски безопасности!)
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    dangerouslyAllowSVG: true,
  },

  // Экспериментальные функции
  experimental: {
    // Оптимизация производительности
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "date-fns",
      "recharts",
    ],
    // PPR отключен - требует Suspense на всех динамических страницах
    // Можно включить позже после рефакторинга dashboard страниц
    // cacheComponents: true,
  },

  // Компрессия
  compress: true,

  // Заголовки безопасности (базовые)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(
  nextConfig
);
