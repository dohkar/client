"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Heart,
  LayoutList,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
  LifeBuoy,
  UserRound,
} from "lucide-react";
import { useAuthStore } from "@/stores";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRole } from "@/types";

function displayUserId(id: string) {
  const compact = id.replace(/-/g, "");
  if (compact.length <= 8) return compact.toUpperCase();
  return compact.slice(0, 8).toUpperCase();
}

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match: (pathname: string | null) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: ROUTES.accountListings,
    label: "Объявления",
    icon: LayoutList,
    match: (p) =>
      !!p && (p === ROUTES.accountListings || p.startsWith(`${ROUTES.accountListings}/`)),
  },
  {
    href: ROUTES.favorites,
    label: "Избранное",
    icon: Heart,
    match: (p) => p === ROUTES.favorites,
  },
  {
    href: ROUTES.messages,
    label: "Сообщения",
    icon: MessageSquare,
    match: (p) => !!p && p.startsWith(ROUTES.messages),
  },
  {
    href: ROUTES.accountSupport,
    label: "Техподдержка",
    icon: LifeBuoy,
    match: (p) => p === ROUTES.accountSupport,
  },
  {
    href: ROUTES.accountProfile,
    label: "Профиль",
    icon: UserRound,
    match: (p) => p === ROUTES.accountProfile,
  },
  {
    href: ROUTES.accountSettings,
    label: "Настройки",
    icon: Settings,
    match: (p) => p === ROUTES.accountSettings,
  },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isInitialized, isLoading, user, logout } = useAuthStore();

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (!isInitialized || isLoading) return;
    if (!isAuthenticated) {
      router.replace(
        `${ROUTES.login}?returnUrl=${encodeURIComponent(pathname || ROUTES.account)}`
      );
    }
  }, [isAuthenticated, isInitialized, isLoading, pathname, router]);

  if (pathname?.startsWith(ROUTES.accountAdmin)) {
    return <>{children}</>;
  }

  if (!isInitialized || isLoading || !isAuthenticated || !user) {
    return (
      <div className='min-h-[calc(100vh-65px)] flex items-center justify-center'>
        <p className='text-sm text-muted-foreground'>Загрузка…</p>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push(ROUTES.home);
    router.refresh();
  };

  return (
    <div className='min-h-[calc(100vh-65px)] border-t border-border/60 bg-muted/15'>
      <div className='container mx-auto px-3 sm:px-4 py-6 lg:py-8'>
        <div className='flex flex-col gap-6 lg:flex-row lg:gap-8'>
          <aside className='w-full shrink-0 lg:w-64'>
            <div className='rounded-xl border border-border bg-card/80 shadow-sm overflow-hidden'>
              <div className='p-4 border-b border-border/80'>
                <Link
                  href={ROUTES.profile(user.id)}
                  className='flex items-center gap-3 rounded-lg p-1 -m-1 hover:bg-accent/50 transition-colors'
                >
                  <Avatar className='h-14 w-14 shrink-0 border border-border'>
                    <AvatarImage src={user.avatar ?? undefined} alt='' />
                    <AvatarFallback className='text-lg'>
                      {(user.name?.trim()?.[0] ?? "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1 text-left'>
                    <p className='font-semibold text-foreground truncate'>
                      {user.name?.trim() || "Пользователь"}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      ID: {displayUserId(user.id)}
                    </p>
                  </div>
                </Link>
              </div>

              <nav className='p-2 flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible border-b border-border/80'>
                {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
                  const active = match(pathname);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
                        active
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-accent/60"
                      )}
                    >
                      <Icon className='h-4 w-4 shrink-0 opacity-80' />
                      {label}
                    </Link>
                  );
                })}
                {isAdmin ? (
                  <Link
                    href={ROUTES.accountAdmin}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
                      pathname?.startsWith(ROUTES.accountAdmin)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-accent/60"
                    )}
                  >
                    <Shield className='h-4 w-4 shrink-0 opacity-80' />
                    Админ-панель
                  </Link>
                ) : null}
              </nav>

              <div className='p-2'>
                <Button
                  type='button'
                  variant='ghost'
                  className='w-full justify-start gap-2.5 text-destructive hover:text-destructive hover:bg-destructive/10'
                  onClick={handleLogout}
                >
                  <LogOut className='h-4 w-4 shrink-0' />
                  Выйти
                </Button>
              </div>
            </div>
          </aside>

          <main className='flex-1 min-w-0'>{children}</main>
        </div>
      </div>
    </div>
  );
}
