"use client";

import { useAuthStore } from "@/stores";
import {
  SellLandingSection,
  SellFormSection,
  SellPageSkeleton,
} from "@/components/features/sell";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Разместить объявление",
  description:
    "Разместите объявление на Дохкар: недвижимость, транспорт, электроника. Быстро, удобно, эффективно.",
  url: "https://dohkar.ru/sell",
  mainEntity: {
    "@type": "Service",
    name: "Размещение объявлений",
    provider: {
      "@type": "Organization",
      name: "Дохкар",
    },
  },
};

export default function SellPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  if (!isInitialized) {
    return <SellPageSkeleton />;
  }

  if (isAuthenticated) {
    return <SellFormSection />;
  }

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SellLandingSection />
    </>
  );
}
