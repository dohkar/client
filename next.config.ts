import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Output для оптимального деплоя
  output: "standalone",

  // Оптимизация изображений: явные домены для сидов (picsum) и загрузок (Cloudinary)
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "http", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "**", pathname: "/**" },
      { protocol: "http", hostname: "**", pathname: "/**" },
    ],
    dangerouslyAllowSVG: true,
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
