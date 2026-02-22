import type { Metadata } from "next";
import { HOME_DESCRIPTION } from "@/lib/seo";

/** Явные метаданные для главной страницы — гарантируют наличие meta description для Lighthouse и поисковиков */
export const metadata: Metadata = {
  title: "Недвижимость Кавказа — объявления о продаже и аренде",
  description: HOME_DESCRIPTION,
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
