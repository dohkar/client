"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Heart,
  LayoutDashboard,
  PlusCircle,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";
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
  /** Показывать только авторизованным */
  requireAuth?: boolean;
  /** Показывать только гостям */
  requireGuest?: boolean;
  /** Кастомная проверка активного состояния */
  isActive?: (pathname: string) => boolean;
}

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
    label: "Избранное",
    href: ROUTES.favorites,
    icon: Heart,
  },
  {
    label: "Войти",
    href: ROUTES.login,
    icon: User,
    requireGuest: true,
    isActive: (pathname) => pathname === ROUTES.login || pathname.startsWith("/auth/"),
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

  // Гость: Войти вместо Кабинета — всегда 5 слотов, без скачков layout
  const visibleItems = navItems.filter((item) => {
    if (item.requireAuth) return isAuthenticated;
    if (item.requireGuest) return !isAuthenticated;
    return true;
  });

  return (
    <nav
      className='fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden pb-safe'
      aria-label='Мобильная навигация'
    >
      <div className='container mx-auto px-1'>
        <div className='flex items-center justify-around h-16'>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive
              ? item.isActive(pathname)
              : pathname === item.href ||
                (item.href !== ROUTES.home && pathname?.startsWith(item.href));

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
