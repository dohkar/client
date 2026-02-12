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
  name: "Разместить объявление о недвижимости",
  description:
    "Разместите объявление о недвижимости на платформе Дохкар. Быстро, удобно, эффективно.",
  url: "https://dohkar.ru/sell",
  mainEntity: {
    "@type": "Service",
    name: "Размещение объявлений о недвижимости",
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
