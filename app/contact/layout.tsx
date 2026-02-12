import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Контакты",
  description:
    "Свяжитесь с командой Дохкар: поддержка пользователей, вопросы по объявлениям и сотрудничеству. Мы на связи и готовы помочь.",
  path: "/contact",
  keywords: ["контакты Дохкар", "поддержка", "связаться"],
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
