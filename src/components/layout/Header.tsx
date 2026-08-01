"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  User,
  LogOut,
  LayoutDashboard,
  List,
  Heart,
  UserCircle,
  Shield,
  MessageSquare,
  UserIcon,
  ChevronsUpDown,
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useAuthStore } from "@/stores";
import { ROUTES } from "@/constants";
import { UserRole } from "@/types";
import { ThemeToggle } from "@/components/theme-toggle";

const USER_MENU_ITEMS = [
  { href: ROUTES.dashboard, icon: LayoutDashboard, label: "Кабинет" },
  { href: `${ROUTES.dashboard}/profile`, icon: UserCircle, label: "Профиль" },
  { href: ROUTES.messages, icon: MessageSquare, label: "Сообщения" },
  { href: ROUTES.favorites, icon: Heart, label: "Избранное" },
  { href: `${ROUTES.dashboard}/listings`, icon: List, label: "Мои объявления" },
] as const;

function UserMenuLinks({ isAdmin }: { isAdmin: boolean }) {
  return (
    <>
      {isAdmin ? (
        <Link href={`${ROUTES.dashboard}/admin`}>
          <div className='flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg hover:bg-accent/70 cursor-pointer text-red-600'>
            <Shield className='h-4 w-4 shrink-0' />
            Админ-панель
          </div>
        </Link>
      ) : (
        <Link href={`${ROUTES.dashboard}/support`}>
          <div className='flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg hover:bg-accent/70 cursor-pointer text-green-600'>
            <UserIcon className='h-4 w-4 shrink-0' />
            Поддержка
          </div>
        </Link>
      )}
      {USER_MENU_ITEMS.map(({ href, icon: Icon, label }) => (
        <Link href={href} key={href}>
          <div className='flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg hover:bg-accent/70 cursor-pointer'>
            <Icon className='h-4 w-4 shrink-0' />
            {label}
          </div>
        </Link>
      ))}
    </>
  );
}

/**
 * Desktop header. On mobile navigation is handled by MobileBottomNav.
 */
export function Header() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push(ROUTES.home);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, router]);

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 transition-shadow hidden md:block'>
      <div className='max-w-7xl mx-auto px-8 h-16 flex items-center justify-between gap-4'>
        <Link
          href={ROUTES.home}
          className='flex items-center group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md'
          aria-label='Дохкар — на главную'
        >
          <img src='/images/logo2.png' alt='Дохкар' width={180} height={64} />
        </Link>

        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-1.5'>
            {isAuthenticated ? (
              <>
                <ThemeToggle variant='icon' />
                <Link href={ROUTES.favorites} aria-label='Избранное'>
                  <Button variant='clear' size='default' className='shrink-0 text-base'>
                    <Heart className='h-5 w-5' />
                    Избранное
                  </Button>
                </Link>
                <HoverCard openDelay={50} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <Link href={`${ROUTES.dashboard}/profile`} aria-label='Профиль'>
                      <Button variant='clear' className='gap-1.5 shrink-0 text-base'>
                        <ChevronsUpDown />
                        Профиль
                      </Button>
                    </Link>
                  </HoverCardTrigger>
                  <HoverCardContent
                    align='center'
                    sideOffset={8}
                    className='w-56 p-1.5 shadow-xl rounded-xl'
                  >
                    <div className='space-y-0.5'>
                      <UserMenuLinks isAdmin={isAdmin} />
                    </div>
                    <div className='mt-1.5 pt-1.5 border-t'>
                      <ThemeToggle variant='embed' />
                    </div>
                    <div className='pt-1.5 mt-1 border-t'>
                      <button
                        type='button'
                        onClick={handleLogout}
                        className='flex w-full items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg hover:bg-destructive/10 cursor-pointer text-destructive'
                        disabled={isLoggingOut}
                      >
                        <LogOut className='h-4 w-4 shrink-0' />
                        {isLoggingOut ? "Выход…" : "Выйти"}
                      </button>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </>
            ) : (
              <>
                <ThemeToggle variant='icon' />
                <Link href={ROUTES.favorites}>
                  <Button
                    variant='clear'
                    size='default'
                    className='gap-1.5 shrink-0 text-base'
                  >
                    <Heart className='h-5 w-5' />
                    Избранное
                  </Button>
                </Link>
                <Link href={ROUTES.login}>
                  <Button
                    variant='clear'
                    size='default'
                    className='gap-1.5 shrink-0 text-base'
                  >
                    <User className='h-5 w-5' />
                    Войти
                  </Button>
                </Link>
              </>
            )}
          </div>

          <Link
            href={ROUTES.sell}
            className='shrink-0'
            aria-label='Разместить объявление'
          >
            <Button
              size='default'
              className='bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all h-10 px-5 gap-1.5'
            >
              <PlusCircle className='size-5' aria-hidden />
              <span>Разместить</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
