import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Условия использования",
  description:
    "Условия использования платформы Дохкар: права и обязанности пользователей, правила размещения объявлений и использования сервиса.",
  path: "/terms",
  keywords: ["условия использования", "правила", "пользовательское соглашение"],
});

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
