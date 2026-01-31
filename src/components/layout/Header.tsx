"use client";
import { useEffect, useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  PlusCircle,
  User,
  LogOut,
  LayoutDashboard,
  Heart,
  UserCircle,
  Shield,
  MessageSquare,
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore, useUIStore } from "@/stores";
import { ROUTES } from "@/constants";
import { formatUserName } from "@/lib/utils/format-name";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { name: "Квартиры", href: `${ROUTES.search}?type=apartment` },
  { name: "Дома", href: `${ROUTES.search}?type=house` },
  { name: "Участки", href: `${ROUTES.search}?type=land` },
  { name: "Коммерция", href: `${ROUTES.search}?type=commercial` },
] as const;

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useUIStore();
  const [isClosing, setIsClosing] = useState(false);
  const isPortalVisible = isMobileMenuOpen || isClosing;

  const userName = useMemo(() => formatUserName(user?.name), [user?.name]);
  const userInitial = useMemo(() => userName.charAt(0).toUpperCase(), [userName]);
  const isAdmin = useMemo(() => user?.role?.toUpperCase() === "ADMIN", [user?.role]);

  // Блокировка скролла при открытом или закрывающемся мобильном меню
  useEffect(() => {
    if (isPortalVisible) {
      document.body.style.overflow = "hidden";
      document.body.style.overflowX = "hidden";
    } else {
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("overflow-x");
    }
    return () => {
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("overflow-x");
    };
  }, [isPortalVisible]);

  // Закрытие меню при смене страницы
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setIsClosing(true);
  }, [setMobileMenuOpen]);

  useEffect(() => {
    if (!isClosing) return;
    const t = setTimeout(() => setIsClosing(false), 300);
    return () => clearTimeout(t);
  }, [isClosing]);

  const handleOverlayClick = useCallback(() => {
    closeMobileMenu();
  }, [closeMobileMenu]);

  const handleMenuClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Закрытие по Escape
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileMenu();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen, closeMobileMenu]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.push(ROUTES.home);
    } catch {
      router.push(ROUTES.home);
    }
  }, [logout, router]);

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 transition-shadow'>
      <div className='container mx-auto px-4 h-16 flex items-center justify-between'>
        {/* Логотип */}
        <Link
          href={ROUTES.home}
          className='flex items-center group shrink-0 focus:outline-none'
        >
          <span
            className='
              text-2xl md:text-3xl font-extrabold tracking-[0.025em]
              bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900
              bg-clip-text text-transparent
              transition-all duration-300
              group-hover:scale-105 group-hover:drop-shadow-md
            '
          >
            Дохкар
          </span>
        </Link>

        {/* Навигация десктоп */}
        <nav className='hidden md:flex items-center gap-8 text-sm font-medium'>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className={cn(
                "relative py-1 transition-colors hover:text-primary",
                pathname.includes(cat.href.split("?")[0]) && "text-primary font-semibold",
                "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300",
                pathname.includes(cat.href.split("?")[0])
                  ? "after:w-full"
                  : "after:w-0 hover:after:w-full"
              )}
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        {/* Правая часть */}
        <div className='flex items-center gap-3 md:gap-4'>
          {/* Авторизация десктоп */}
          <div className='hidden md:flex items-center gap-3'>
            {isAuthenticated ? (
              <>
                <Link href={ROUTES.favorites}>
                  <Button variant='ghost' size='icon' className='h-9 w-9'>
                    <Heart className='h-5 w-5' />
                  </Button>
                </Link>

                <HoverCard openDelay={80} closeDelay={200}>
                  <HoverCardTrigger asChild>
                    <Link
                      href={`${ROUTES.dashboard}/profile`}
                      className='flex items-center gap-2.5 hover:opacity-90 transition'
                    >
                      <Avatar className='h-9 w-9 border border-border/60 shadow-sm'>
                        <AvatarImage src={user?.avatar} alt={userName} />
                        <AvatarFallback className='bg-primary/10 text-primary font-medium'>
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <span className='hidden lg:inline font-medium text-sm text-foreground/90'>
                        {userName}
                      </span>
                    </Link>
                  </HoverCardTrigger>

                  <HoverCardContent
                    align='end'
                    sideOffset={12}
                    className='w-64 p-2 shadow-2xl rounded-xl'
                  >
                    <div className='space-y-1'>
                      {isAdmin && (
                        <Link href={`${ROUTES.dashboard}/admin`}>
                          <div className='flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent/70 cursor-pointer text-red-600'>
                            <Shield className='h-4 w-4' />
                            Админ-панель
                          </div>
                        </Link>
                      )}
                      <Link href={ROUTES.dashboard}>
                        <div className='flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent/70 cursor-pointer'>
                          <LayoutDashboard className='h-4 w-4' />
                          Кабинет
                        </div>
                      </Link>
                      <Link href={`${ROUTES.dashboard}/profile`}>
                        <div className='flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent/70 cursor-pointer'>
                          <UserCircle className='h-4 w-4' />
                          Профиль
                        </div>
                      </Link>
                      <Link href={`${ROUTES.messages}`}>
                        <div className='flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent/70 cursor-pointer'>
                          <MessageSquare className='h-4 w-4' /> {/* или другой иконкой */}
                          Сообщения
                        </div>
                      </Link>
                      <Link href={ROUTES.favorites}>
                        <div className='flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent/70 cursor-pointer'>
                          <Heart className='h-4 w-4' />
                          Избранное
                        </div>
                      </Link>
                      <Link href={`${ROUTES.dashboard}/listings`}>
                        <div className='flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent/70 cursor-pointer'>
                          <LayoutDashboard className='h-4 w-4' />
                          Мои объявления
                        </div>
                      </Link>
                    </div>

                    <div className='pt-2 mt-1 border-t'>
                      <div
                        onClick={handleLogout}
                        className='flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 cursor-pointer text-destructive'
                      >
                        <LogOut className='h-4 w-4' />
                        Выйти
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </>
            ) : (
              <Link href={ROUTES.login}>
                <Button variant='outline' size='sm' className='gap-2'>
                  <User className='h-4 w-4' />
                  Войти
                </Button>
              </Link>
            )}
          </div>

          {/* Кнопка Разместить */}
          <Link href={ROUTES.sell}>
            <Button className='bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all h-10 px-4 md:px-6 gap-2'>
              <PlusCircle className='h-4.5 w-4.5' />
              <span className='hidden sm:inline'>Разместить</span>
              <span className='sm:hidden'>+</span>
            </Button>
          </Link>

          {/* Кнопка мобильного меню */}
          <button
            className='md:hidden p-2 hover:bg-accent rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center'
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {isMobileMenuOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
          </button>
        </div>
      </div>

      {/* Мобильное меню: портал поверх всего с непрозрачной панелью */}
      {typeof document !== "undefined" &&
        isPortalVisible &&
        createPortal(
          <div className='fixed inset-0 z-[100] md:hidden' aria-hidden='true'>
            {/* Оверлей — более мягкий, чуть прозрачнее */}
            <div
              className={cn(
                "absolute inset-0 bg-black/20 backdrop-blur-md transition-opacity duration-400",
                isClosing && "opacity-0"
              )}
              onClick={handleOverlayClick}
            />

            {/* Панель меню — светлая, с лёгким blur, скруглённые углы слева */}
            <div
              role='dialog'
              aria-modal='true'
              aria-label='Меню навигации'
              className={cn(
                "absolute top-0 right-0 bottom-0 w-80 max-w-[90vw]",
                "bg-background/95 backdrop-blur-xl border-l border-border/50",
                "shadow-2xl rounded-l-3xl overflow-hidden",
                "transition-transform duration-400 ease-out",
                isClosing ? "translate-x-full" : "translate-x-0"
              )}
              onClick={handleMenuClick}
            >
              {/* Шапка: логотип + крестик */}
              <div className='sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-background/80 backdrop-blur-md border-b border-border/40'>
                <span className='text-xl font-extrabold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent'>
                  Дохкар
                </span>
                <button
                  onClick={closeMobileMenu}
                  className='p-2 cursor-pointer flex items-center justify-center rounded-full hover:bg-accent transition-colors focus:outline-none'
                  aria-label='Закрыть меню'
                >
                  <X className='h-6 w-6 text-foreground' />
                </button>
              </div>

              {/* Контент с прокруткой */}
              <div className='flex-1 overflow-y-auto overscroll-contain px-4 py-6'>
                {/* Категории */}
                <div className='space-y-2 mb-8'>
                  <p className='px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                    Категории
                  </p>
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      className='flex items-center px-5 py-3.5 text-base font-medium rounded-xl hover:bg-accent/70 active:bg-accent transition-colors'
                      onClick={() => closeMobileMenu()}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>

                {/* Аккаунт */}
                {isAuthenticated ? (
                  <div className='space-y-2'>
                    <p className='px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                      Аккаунт
                    </p>

                    {isAdmin && (
                      <Link href={`${ROUTES.dashboard}/admin`}>
                        <div className='flex items-center gap-3.5 px-5 py-3.5 rounded-xl hover:bg-red-500/10 text-red-600 transition-colors'>
                          <Shield className='h-5 w-5' />
                          Админ-панель
                        </div>
                      </Link>
                    )}

                    <Link href={ROUTES.dashboard}>
                      <div className='flex items-center gap-3.5 px-5 py-3.5 rounded-xl hover:bg-accent/70 transition-colors'>
                        <LayoutDashboard className='h-5 w-5' />
                        Кабинет
                      </div>
                    </Link>

                    <Link href={`${ROUTES.dashboard}/profile`}>
                      <div className='flex items-center gap-3.5 px-5 py-3.5 rounded-xl hover:bg-accent/70 transition-colors'>
                        <UserCircle className='h-5 w-5' />
                        Профиль
                      </div>
                    </Link>

                    <Link href={ROUTES.favorites}>
                      <div className='flex items-center gap-3.5 px-5 py-3.5 rounded-xl hover:bg-accent/70 transition-colors'>
                        <Heart className='h-5 w-5' />
                        Избранное
                      </div>
                    </Link>

                    <div
                      onClick={() => {
                        closeMobileMenu();
                        handleLogout();
                      }}
                      className='flex items-center gap-3.5 px-5 py-3.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors cursor-pointer'
                    >
                      <LogOut className='h-5 w-5' />
                      Выйти
                    </div>
                  </div>
                ) : (
                  <div className='px-4'>
                    <Link href={ROUTES.login}>
                      <Button
                        variant='default'
                        className='w-full py-6 text-base font-medium rounded-xl'
                        onClick={() => closeMobileMenu()}
                      >
                        Войти / Зарегистрироваться
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
