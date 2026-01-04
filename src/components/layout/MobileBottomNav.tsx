"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, LayoutDashboard, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import { ROUTES } from "@/constants";

const navItems = [
  {
    label: "Главная",
    href: ROUTES.home,
    icon: Home,
  },
  {
    label: "Поиск",
    href: ROUTES.search,
    icon: Search,
  },
  {
    label: "Избранное",
    href: ROUTES.favorites,
    icon: Heart,
  },
  {
    label: "Кабинет",
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
    requireAuth: true,
  },
  {
    label: "Разместить",
    href: ROUTES.sell,
    icon: PlusCircle,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  // Фильтруем элементы, требующие авторизации
  const visibleItems = navItems.filter(
    (item) => !item.requireAuth || isAuthenticated
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden pb-safe"
      aria-label="Мобильная навигация"
    >
      <div className="container mx-auto px-2">
        <div className="flex items-center justify-around h-16">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== ROUTES.home && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full min-h-[44px] transition-colors relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <div
                  className={cn(
                    "relative flex items-center justify-center",
                    isActive && "scale-110"
                  )}
                >
                  <Icon className="size-5" />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-tight",
                    isActive && "font-semibold"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
