import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Помощь",
  description:
    "Часто задаваемые вопросы и полезная информация по использованию платформы Дохкар: поиск недвижимости, размещение объявлений, безопасность и оплата.",
  path: "/help",
  keywords: ["помощь", "FAQ", "вопросы", "Дохкар", "инструкция"],
});

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
