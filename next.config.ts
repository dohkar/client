import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

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
    dangerouslyAllowSVG: true, // если хотите SVG, опционально
    // или можно просто отключить domains и remotePatterns для полного разрешения (Next 13+)
    // unoptimized: true, // <- альтернативный способ (отключает оптимизацию и ограничения)
  },

  // Экспериментальные функции
  experimental: {
    // Оптимизация производительности
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
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

export default nextConfig;
