"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Heart,
  LayoutDashboard,
  Plus,
  User,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, useUIStore } from "@/stores";
import { ROUTES } from "@/constants";
import { DEFAULT_SEARCH_REGION, DEFAULT_SEARCH_CATEGORY } from "@/constants/defaults";
import { buildSearchUrl, isSearchPathname } from "@/lib/url/segments";

const DEFAULT_SEARCH_URL = buildSearchUrl({
  region: DEFAULT_SEARCH_REGION,
  category: DEFAULT_SEARCH_CATEGORY,
  dealType: "prodam",
});

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isPrimaryAction?: boolean;
  requireAuth?: boolean;
  requireGuest?: boolean;
  isActive?: (pathname: string) => boolean;
}

/**
 * После скрытия хедера на мобилке:
 * гость — Избранное + Войти;
 * авторизован — Сообщения + Кабинет (избранное в кабинете).
 * Порядок: discovery → CTA → личное.
 */
const navItems: NavItem[] = [
  {
    label: "Главная",
    href: ROUTES.home,
    icon: Home,
  },
  {
    label: "Поиск",
    href: DEFAULT_SEARCH_URL,
    icon: Search,
    isActive: (pathname) => isSearchPathname(pathname),
  },
  {
    label: "Разместить",
    href: ROUTES.sell,
    icon: Plus,
    isPrimaryAction: true,
  },
  {
    label: "Избранное",
    href: ROUTES.favorites,
    icon: Heart,
    requireGuest: true,
  },
  {
    label: "Сообщения",
    href: ROUTES.messages,
    icon: MessageSquare,
    requireAuth: true,
  },
  {
    label: "Войти",
    href: ROUTES.login,
    icon: User,
    requireGuest: true,
    isActive: (pathname) =>
      pathname === ROUTES.login || pathname.startsWith("/auth/"),
  },
  {
    label: "Кабинет",
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
    requireAuth: true,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const isMobileBottomNavHidden = useUIStore((s) => s.isMobileBottomNavHidden);

  const visibleItems = navItems.filter((item) => {
    if (item.requireAuth) return isAuthenticated;
    if (item.requireGuest) return !isAuthenticated;
    return true;
  });

  if (isMobileBottomNavHidden) {
    return null;
  }

  return (
    <nav
      className='fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden pb-safe'
      aria-label='Мобильная навигация'
    >
      <div className='container mx-auto px-1'>
        <div className='flex items-end justify-around h-16 pt-1'>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive
              ? item.isActive(pathname)
              : pathname === item.href ||
                (item.href !== ROUTES.home && pathname?.startsWith(item.href));

            if (item.isPrimaryAction) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className='flex flex-col items-center justify-end gap-0.5 flex-1 h-full min-h-[44px] min-w-0 relative -mt-2'
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center size-11 rounded-full shadow-md transition-transform",
                      "bg-gradient-to-br from-emerald-600 to-teal-600 text-white",
                      "active:scale-95",
                      isActive &&
                        "ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
                    )}
                  >
                    <Icon className='size-5' strokeWidth={2.5} />
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium leading-tight truncate max-w-full px-0.5",
                      isActive ? "text-primary font-semibold" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full min-h-[44px] min-w-0 transition-colors relative",
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
                  <Icon className='size-5' />
                  {isActive && (
                    <span className='absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary' />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-tight truncate max-w-full px-0.5",
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
