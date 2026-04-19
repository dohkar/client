import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { AccountShell } from "@/components/layout/account-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Личный кабинет",
  description: "Управление объявлениями, профилем и настройками на Дохкар.",
  path: "/account",
  noIndex: true,
});

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
