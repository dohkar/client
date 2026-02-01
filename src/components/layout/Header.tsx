"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
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
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { useAuthModal } from "@/components/features/auth-modal"; // временно: редирект на /auth/login
import { useAuthStore, useUIStore } from "@/stores";
import { ROUTES } from "@/constants";
import { formatUserName } from "@/lib/utils/format-name";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types";

const CATEGORIES = [
  { name: "Квартиры", href: `${ROUTES.search}?type=apartment` },
  { name: "Дома", href: `${ROUTES.search}?type=house` },
  { name: "Участки", href: `${ROUTES.search}?type=land` },
  { name: "Коммерция", href: `${ROUTES.search}?type=commercial` },
] as const;

const USER_MENU_ITEMS = [
  { href: ROUTES.dashboard, icon: LayoutDashboard, label: "Кабинет" },
  { href: `${ROUTES.dashboard}/profile`, icon: UserCircle, label: "Профиль" },
  { href: ROUTES.messages, icon: MessageSquare, label: "Сообщения" },
  { href: ROUTES.favorites, icon: Heart, label: "Избранное" },
  { href: `${ROUTES.dashboard}/listings`, icon: List, label: "Мои объявления" },
] as const;

function CategoryLinks({
  categories,
}: {
  categories: { name: string; href: string; isActive: boolean }[];
}) {
  return (
    <>
      {categories.map((cat) => (
        <Link
          key={cat.name}
          href={cat.href}
          className={cn(
            "relative py-1 transition-colors hover:text-primary",
            cat.isActive && "text-primary font-semibold",
            "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300",
            cat.isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
          )}
          aria-current={cat.isActive ? "page" : undefined}
        >
          {cat.name}
        </Link>
      ))}
    </>
  );
}

function UserMenuLinks({ isAdmin, isSupport }: { isAdmin: boolean; isSupport: boolean }) {
  return (
    <>
      {isAdmin && (
        <Link href={`${ROUTES.dashboard}/admin`}>
          <div className='flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg hover:bg-accent/70 cursor-pointer text-red-600'>
            <Shield className='h-4 w-4 shrink-0' />
            Админ-панель
          </div>
        </Link>
      )}
      {isSupport && (
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

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { isAuthenticated, user, logout } = useAuthStore();
  const { isMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useUIStore();
  // const { openAuthModal } = useAuthModal(); // временно: редирект на /auth/login

  const [showMenu, setShowMenu] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const mobileMenuPanelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isSupport = user?.role === UserRole.SUPPORT;
  const userName = formatUserName(user?.name);
  const userInitial = userName.charAt(0).toUpperCase();

  // Вычисляем актуальные категории
  const categories = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const type = new URLSearchParams(cat.href.split("?")[1] || "").get("type");
      const isActive = pathname === ROUTES.search && searchParams.get("type") === type;
      return { ...cat, isActive };
    });
  }, [pathname, searchParams]);

  // Управление анимацией мобильного меню
  useEffect(() => {
    if (isMobileMenuOpen) {
      setShowMenu(true);
      setIsAnimating(false);
      if (timeoutId.current) clearTimeout(timeoutId.current);
      timeoutId.current = setTimeout(() => {
        setIsAnimating(true);
        timeoutId.current = null;
      }, 20);
      return () => {
        if (timeoutId.current) clearTimeout(timeoutId.current);
      };
    }
    if (showMenu) {
      setIsAnimating(false);
      if (timeoutId.current) clearTimeout(timeoutId.current);
      timeoutId.current = setTimeout(() => {
        setShowMenu(false);
        timeoutId.current = null;
      }, 300);
      return () => {
        if (timeoutId.current) clearTimeout(timeoutId.current);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobileMenuOpen]);

  // Запрет скролла body при открытом мобильном меню
  useEffect(() => {
    if (showMenu) {
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
  }, [showMenu]);

  // Закрытие меню при смене route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  // Закрыть мобильное меню
  const closeMobileMenu = useCallback(
    () => setMobileMenuOpen(false),
    [setMobileMenuOpen]
  );

  // Закрытие меню overlay-кликом
  const handleOverlayClick = closeMobileMenu;

  // Возврат фокуса на меню-кнопку
  useEffect(() => {
    if (!showMenu && menuBtnRef.current && document.activeElement === document.body) {
      menuBtnRef.current.focus({ preventScroll: true });
    }
  }, [showMenu]);

  // Escape — закрытие меню
  useEffect(() => {
    if (!showMenu) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileMenu();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [showMenu, closeMobileMenu]);

  // Tab-фокус внутри мобильного меню (фокус трап)
  useEffect(() => {
    if (!showMenu || !isAnimating || !mobileMenuPanelRef.current) return;
    closeBtnRef.current?.focus({ preventScroll: true });
    const panel = mobileMenuPanelRef.current;
    const selector =
      'button:not([disabled]):not([tabindex="-1"]), [href]:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab" || !panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => el.offsetParent !== null && !el.hasAttribute("disabled")
      );
      if (!focusables.length) return;
      const [first, ...rest] = focusables;
      const last = rest[rest.length - 1] || first;
      const active = document.activeElement as HTMLElement;
      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    panel.addEventListener("keydown", onKeyDown);
    return () => panel.removeEventListener("keydown", onKeyDown);
  }, [showMenu, isAnimating]);

  // Logout (PC version)
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push(ROUTES.home);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, router]);

  // Logout (Mobile menu)
  const handleMobileLogout = useCallback(() => {
    if (isLoggingOut) return;
    closeMobileMenu();
    setTimeout(handleLogout, 300);
  }, [isLoggingOut, closeMobileMenu, handleLogout]);

  // ──────────────────────────────────────────────────────────────────────────────

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 transition-shadow'>
      <span role='status' aria-live='polite' className='sr-only'>
        {isMobileMenuOpen ? "Меню открыто" : "Меню закрыто"}
      </span>
      <div className='container mx-auto px-4 h-16 flex items-center justify-between gap-4'>
        {/* Branding */}
        <Link
          href={ROUTES.home}
          className='flex items-center group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md'
          aria-label='Дохкар — на главную'
        >
          <span className='text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 bg-clip-text text-transparent transition-all duration-200 group-hover:opacity-90'>
            Дохкар
          </span>
        </Link>
        {/* Desktop Nav */}
        <nav
          className='hidden md:flex items-center gap-10 text-sm font-medium'
          aria-label='Категории'
        >
          <CategoryLinks categories={categories} />
        </nav>
        {/* Actions */}
        <div className='flex items-center gap-2 md:gap-3'>
          <div className='hidden md:flex items-center gap-2'>
            {isAuthenticated ? (
              <>
                <Link href={ROUTES.favorites} aria-label='Избранное'>
                  <Button variant='ghost' size='icon-sm' className='shrink-0'>
                    <Heart className='h-5 w-5' />
                  </Button>
                </Link>
                <HoverCard openDelay={100} closeDelay={150}>
                  <HoverCardTrigger asChild>
                    <Link
                      href={`${ROUTES.dashboard}/profile`}
                      className='flex items-center gap-2 hover:opacity-90 transition shrink-0'
                      aria-label='Профиль'
                    >
                      <Avatar className='h-8 w-8 border border-border/60 shadow-sm shrink-0'>
                        <AvatarImage src={user?.avatar} alt={userName} />
                        <AvatarFallback className='bg-primary/10 text-primary text-sm font-medium'>
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <span className='hidden lg:inline font-medium text-sm text-foreground/90 truncate max-w-[120px]'>
                        {userName}
                      </span>
                    </Link>
                  </HoverCardTrigger>
                  <HoverCardContent
                    align='end'
                    sideOffset={8}
                    className='w-56 p-1.5 shadow-xl rounded-xl'
                  >
                    <div className='space-y-0.5'>
                      <UserMenuLinks isAdmin={isAdmin} isSupport={isSupport} />
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
              <Button
                variant='outline'
                size='sm'
                className='gap-1.5 shrink-0'
                onClick={() => router.push(ROUTES.login)}
              >
                <User className='h-4 w-4' />
                Войти
              </Button>
            )}
          </div>
          <Link href={ROUTES.sell} className='shrink-0'>
            <Button
              size='sm'
              className='bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all h-9 md:h-10 px-3 md:px-5 gap-1.5'
            >
              <PlusCircle className='size-5' />
              <span className='hidden sm:inline'>Разместить</span>
            </Button>
          </Link>
          <button
            ref={menuBtnRef}
            type='button'
            className={cn(
              "md:hidden p-2.5 hover:bg-accent rounded-xl transition-colors flex items-center justify-center touch-manipulation",
              "min-h-[44px] min-w-[44px]"
            )}
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </button>
        </div>
      </div>
      {/* Мобильное меню */}
      {typeof document !== "undefined" &&
        showMenu &&
        createPortal(
          <div className='fixed inset-0 z-[100] md:hidden'>
            <div
              className={cn(
                "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
                !isAnimating && "opacity-0 pointer-events-none"
              )}
              aria-hidden={!isAnimating}
              onClick={handleOverlayClick}
            />
            <div
              ref={mobileMenuPanelRef}
              role='dialog'
              aria-modal='true'
              aria-label='Мобильное меню'
              aria-labelledby='header-mobile-menu-title'
              data-state={isAnimating ? "open" : "closed"}
              className={cn(
                "absolute top-0 right-0 bottom-0 w-80 max-w-[90vw] flex flex-col bg-background border-l border-border/50 shadow-2xl rounded-l-3xl overflow-hidden transition-transform duration-300 ease-out",
                "data-[state=closed]:translate-x-full",
                "data-[state=open]:translate-x-0"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className='sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-background/95 backdrop-blur-md border-b border-border/40 shrink-0'>
                <Link
                  href={ROUTES.home}
                  onClick={closeMobileMenu}
                  className='text-xl font-extrabold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent'
                  tabIndex={0}
                >
                  <span id='header-mobile-menu-title'>Дохкар</span>
                </Link>
                <button
                  ref={closeBtnRef}
                  type='button'
                  onClick={closeMobileMenu}
                  className='p-2.5 rounded-full hover:bg-accent transition-colors focus:outline-none'
                  aria-label='Закрыть меню'
                >
                  <X className='h-6 w-6' />
                </button>
              </div>
              <div className='flex-1 overflow-y-auto px-4 py-6 space-y-8'>
                <div className='space-y-2'>
                  <p className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                    Категории
                  </p>
                  {categories.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      className={cn(
                        "flex items-center px-4 py-3.5 text-base font-medium rounded-xl hover:bg-accent/70 active:bg-accent transition-colors min-h-[48px]",
                        cat.isActive && "text-primary font-semibold"
                      )}
                      aria-current={cat.isActive ? "page" : undefined}
                      onClick={closeMobileMenu}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
                {isAuthenticated ? (
                  <div className='space-y-2 border-t pt-5'>
                    <p className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                      Аккаунт
                    </p>
                    {isAdmin && (
                      <Link href={`${ROUTES.dashboard}/admin`} onClick={closeMobileMenu}>
                        <div className='flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-red-500/10 text-red-600 transition-colors min-h-[48px]'>
                          <Shield className='h-5 w-5' />
                          Админ-панель
                        </div>
                      </Link>
                    )}
                    {USER_MENU_ITEMS.map(({ href, icon: Icon, label }) => (
                      <Link href={href} onClick={closeMobileMenu} key={href}>
                        <div className='flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-accent/70 transition-colors min-h-[48px]'>
                          <Icon className='h-5 w-5' />
                          {label}
                        </div>
                      </Link>
                    ))}
                    <button
                      type='button'
                      onClick={handleMobileLogout}
                      disabled={isLoggingOut}
                      className='flex w-full items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors min-h-[48px] text-left text-base font-medium disabled:opacity-60 disabled:pointer-events-none'
                    >
                      <LogOut className='h-5 w-5' />
                      {isLoggingOut ? "Выход…" : "Выйти"}
                    </button>
                  </div>
                ) : (
                  <div className='px-3'>
                    <Link href={ROUTES.login} onClick={closeMobileMenu}>
                      <Button
                        variant='default'
                        className='w-full py-6 text-base font-medium rounded-xl'
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
