"use client";
import { useEffect, useCallback, useMemo } from "react";
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

  const userName = useMemo(() => formatUserName(user?.name), [user?.name]);
  const userInitial = useMemo(() => userName.charAt(0).toUpperCase(), [userName]);
  const isAdmin = useMemo(() => user?.role?.toUpperCase() === "ADMIN", [user?.role]);

  // Блокировка скролла при открытом мобильном меню
  useEffect(() => {
    if (isMobileMenuOpen) {
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
  }, [isMobileMenuOpen]);

  // Закрытие меню при смене страницы
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  // Закрытие по Escape
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen, setMobileMenuOpen]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.push(ROUTES.home);
    } catch {
      router.push(ROUTES.home);
    }
  }, [logout, router]);

  const handleOverlayClick = useCallback(() => {
    setMobileMenuOpen(false);
  }, [setMobileMenuOpen]);

  const handleMenuClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

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

      {/* Мобильное меню */}
      {isMobileMenuOpen && (
        <div
          className='fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300'
          onClick={handleOverlayClick}
        />
      )}

      <div
        className={cn(
          "fixed top-16 right-0 bottom-0 w-80 max-w-[90vw] md:hidden bg-background z-50 shadow-2xl transition-transform duration-300 ease-out",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
        onClick={handleMenuClick}
      >
        <div className='p-6 space-y-6'>
          <div className='space-y-2'>
            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2'>
              Категории
            </p>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className='flex items-center px-4 py-3 text-base rounded-xl hover:bg-accent transition-colors'
                onClick={() => setMobileMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {isAuthenticated ? (
            <div className='space-y-2 border-t pt-5'>
              <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2'>
                Аккаунт
              </p>

              {isAdmin && (
                <Link href={`${ROUTES.dashboard}/admin`}>
                  <div className='flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent text-red-600 transition'>
                    <Shield className='h-5 w-5' />
                    Админ-панель
                  </div>
                </Link>
              )}

              <Link href={ROUTES.dashboard}>
                <div className='flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent transition'>
                  <LayoutDashboard className='h-5 w-5' />
                  Кабинет
                </div>
              </Link>

              <Link href={`${ROUTES.dashboard}/profile`}>
                <div className='flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent transition'>
                  <UserCircle className='h-5 w-5' />
                  Профиль
                </div>
              </Link>

              <Link href={ROUTES.favorites}>
                <div className='flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent transition'>
                  <Heart className='h-5 w-5' />
                  Избранное
                </div>
              </Link>

              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className='flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 text-destructive transition cursor-pointer mt-2'
              >
                <LogOut className='h-5 w-5' />
                Выйти
              </div>
            </div>
          ) : (
            <div className='border-t pt-5'>
              <Link href={ROUTES.login}>
                <Button
                  variant='outline'
                  className='w-full justify-start gap-3 py-6 text-base'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className='h-5 w-5' />
                  Войти / Зарегистрироваться
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
