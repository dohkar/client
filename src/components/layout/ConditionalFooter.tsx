"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

/** Маршруты, на которых Footer не показывается (полноэкранный/приложенческий UX) */
const HIDE_FOOTER_PATHS = [
  "/messages",
  "/auth",
  "/dashboard",
  "/sell",
  "/admin",
] as const;

function shouldHideFooter(pathname: string): boolean {
  return HIDE_FOOTER_PATHS.some((path) => pathname.startsWith(path));
}

export function ConditionalFooter() {
  const pathname = usePathname();
  if (shouldHideFooter(pathname ?? "")) return null;
  return <Footer />;
}
