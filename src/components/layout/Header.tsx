"use client";

import { useCallback, useEffect, useRef, useState, Fragment } from "react";
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
  UserIcon,
  ChevronsUpDown,
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useAuthStore, useUIStore } from "@/stores";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types";
import { ThemeToggle } from "@/components/theme-toggle";
import { CATEGORIES } from "@/constants/categories";

const USER_MENU_ITEMS = [
  { href: ROUTES.accountListings, icon: LayoutDashboard, label: "Кабинет" },
  { href: ROUTES.accountProfile, icon: UserCircle, label: "Данные профиля" },
  { href: ROUTES.messages, icon: MessageSquare, label: "Сообщения" },
  { href: ROUTES.favorites, icon: Heart, label: "Избранное" },
] as const;

function UserMenuLinks({ isAdmin }: { isAdmin: boolean }) {
  return (
    <>
      {isAdmin ? (
        <Link href={ROUTES.accountAdmin}>
          <div className='flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg hover:bg-accent/70 cursor-pointer text-red-600'>
            <Shield className='h-4 w-4 shrink-0' />
            Админ-панель
          </div>
        </Link>
      ) : (
        <Link href={ROUTES.accountSupport}>
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

  const { isAuthenticated, user, logout } = useAuthStore();
  const { isMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useUIStore();

  const [showMenu, setShowMenu] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const mobileMenuPanelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN;

  // Управление появлением mobile menu с анимацией
  useEffect(() => {
    if (isMobileMenuOpen) {
      setShowMenu(true);
      setIsAnimating(false);
      timeoutId.current && clearTimeout(timeoutId.current);
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
      timeoutId.current && clearTimeout(timeoutId.current);
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

  // Закрытие мобильного меню при смене route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  const closeMobileMenu = useCallback(
    () => setMobileMenuOpen(false),
    [setMobileMenuOpen]
  );
  const handleOverlayClick = closeMobileMenu;

  // Возврат фокуса на меню-кнопку после закрытия мобильного меню
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
    const onKeyDown = (e: KeyboardEvent) => {
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
    };
    panel.addEventListener("keydown", onKeyDown);
    return () => panel.removeEventListener("keydown", onKeyDown);
  }, [showMenu, isAnimating]);

  // Обработка выхода (logout)
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push(ROUTES.home);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, router]);

  // Обработка выхода (мобильное меню)
  const handleMobileLogout = useCallback(() => {
    if (isLoggingOut) return;
    closeMobileMenu();
    setTimeout(handleLogout, 300);
  }, [isLoggingOut, closeMobileMenu, handleLogout]);

  // ──────────────────────────────────────────────────────────────────────────────

  // Раздел навигационных категорий (для DRY/удобства)
  const renderCategories = (opts?: {
    onClick?: () => void;
    className?: string;
    itemClassName?: string;
  }) =>
    CATEGORIES.map((cat) => (
      <Link
        key={cat.name}
        href={cat.href}
        className={cn(
          "px-2.5 py-1.5 text-base rounded-lg font-medium transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          opts?.itemClassName
        )}
        onClick={opts?.onClick}
      >
        {cat.name}
      </Link>
    ));

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 transition-shadow'>
      <span role='status' aria-live='polite' className='sr-only'>
        {isMobileMenuOpen ? "Меню открыто" : "Меню закрыто"}
      </span>
      <div className='max-w-7xl mx-auto px-8 h-16 flex items-center justify-between gap-4'>
        {/* Лого */}
        <Link
          href={ROUTES.home}
          className='flex items-center group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md'
          aria-label='Дохкар — на главную'
        >
          <img src='/images/logo2.png' alt='Дохкар' width={180} height={64} />
        </Link>

        {/* Actions */}
        <div className='flex items-center gap-2 md:gap-4'>
          {/* Desktop категории */}
          {/*<div className='hidden md:flex items-center gap-2'>{renderCategories()}</div>*/}

          <div className='hidden md:flex items-center gap-1.5'>
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
                    <Link href={ROUTES.accountListings} aria-label='Кабинет'>
                      {/* <Avatar .../> */}
                      <Button variant='clear' className='gap-1.5 shrink-0 text-base'>
                        <ChevronsUpDown />
                        Кабинет
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
                {/* Компактная иконка темы для неавторизованных */}
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
              className='bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all h-9 md:h-10 px-3 md:px-5 gap-1.5'
            >
              <PlusCircle className='size-5' aria-hidden />
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
          <div className='fixed inset-0 z-100 md:hidden'>
            {/* Overlay */}
            <div
              className={cn(
                "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
                !isAnimating && "opacity-0 pointer-events-none"
              )}
              aria-hidden={!isAnimating}
              onClick={handleOverlayClick}
            />
            {/* Mobile Panel */}
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
              {/* Mobile Header */}
              <div className='sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-background/95 backdrop-blur-md border-b border-border/40 shrink-0'>
                <Link
                  href={ROUTES.home}
                  onClick={closeMobileMenu}
                  className='text-xl font-extrabold overflow-hidden bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent flex items-center'
                  tabIndex={0}
                >
                  <img src='/images/logo2.png' alt='Дохкар' width={120} height={44} />
                  {/* <span id="header-mobile-menu-title">Дохкар</span> */}
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
              {/* Mobile body */}
              <div className='flex-1 overflow-y-auto px-4 py-6 space-y-8'>
                {/* Категории */}
                <div className='space-y-2'>
                  <p className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                    Категории
                  </p>
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      className='flex items-center px-4 py-3.5 text-base font-medium rounded-xl hover:bg-accent/70 active:bg-accent transition-colors min-h-[48px]'
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
                      <Link href={ROUTES.accountAdmin} onClick={closeMobileMenu}>
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
                    <div className='border-t pt-4 mt-2'>
                      <p className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2'>
                        Тема
                      </p>
                      <ThemeToggle variant='embed' />
                    </div>
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
                  <div className='space-y-4'>
                    <div className='space-y-2 border-b pb-5'>
                      <p className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                        Сохранённое
                      </p>
                      <Link href={ROUTES.favorites} onClick={closeMobileMenu}>
                        <div className='flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-accent/70 transition-colors min-h-[48px]'>
                          <Heart className='h-5 w-5' />
                          Избранное
                        </div>
                      </Link>
                    </div>
                    <div>
                      <p className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2'>
                        Тема
                      </p>
                      <ThemeToggle variant='embed' />
                    </div>
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
