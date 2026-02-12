import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Сообщения",
  description: "Ваши переписки по объявлениям на Дохкар.",
  path: "/messages",
  noIndex: true,
});

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
