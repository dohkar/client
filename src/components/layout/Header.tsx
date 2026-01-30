"use client";

import { useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore, useUIStore } from "@/stores";
import { ROUTES } from "@/constants";
import { useRouter } from "next/navigation";
import { formatUserName } from "@/lib/utils/format-name";

// Константы вынесены наружу для избежания пересоздания при каждом рендере
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

  // Блокируем скролл body когда меню открыто
  useEffect(() => {
    if (!isMobileMenuOpen) {
      // Восстанавливаем скролл при закрытии меню
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("overflow-x");
      document.documentElement.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("overflow-x");
      return;
    }

    // Блокируем скролл
    document.body.style.overflow = "hidden";
    document.body.style.overflowX = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overflowX = "hidden";

    // Восстанавливаем скролл при размонтировании
    return () => {
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("overflow-x");
      document.documentElement.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("overflow-x");
    };
  }, [isMobileMenuOpen]);

  // Закрываем меню при изменении роута
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  // Обработка Escape для закрытия меню
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen, setMobileMenuOpen]);

  // Обработка выхода с обработкой ошибок
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.push(ROUTES.home);
    } catch (error) {
      // Ошибка при выходе не критична - перенаправляем на главную в любом случае
      // В production можно отправить в систему мониторинга
      router.push(ROUTES.home);
    }
  }, [logout, router]);

  // Обработчик закрытия меню при клике на overlay
  const handleOverlayClick = useCallback(() => {
    setMobileMenuOpen(false);
  }, [setMobileMenuOpen]);

  // Предотвращаем закрытие меню при клике на само меню
  const handleMenuClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Мемоизируем имя пользователя для оптимизации
  const userName = useMemo(() => formatUserName(user?.name), [user?.name]);
  const userInitial = useMemo(() => userName.charAt(0).toUpperCase(), [userName]);

  // Проверка роли админа
  const isAdmin = useMemo(() => user?.role?.toUpperCase() === "ADMIN", [user?.role]);

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60'>
      <div className='container mx-auto px-4 h-16 flex items-center justify-between'>
        {/* Logo */}
        <Link href={ROUTES.home} className='flex items-center gap-2 shrink-0 group'>
          <div className='flex items-center gap-2 px-3 py-1.5 gradient-mountains rounded-md shadow-md transition-transform group-hover:scale-105'>
            <span className='text-white font-bold text-lg tracking-tight'>Дохкар</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className='hidden md:flex items-center gap-8 text-sm font-medium ml-8'>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className='text-muted-foreground hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all'
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className='flex items-center gap-3'>
          {/* Desktop Auth */}
          <div className='hidden md:flex items-center gap-2'>
            {isAuthenticated ? (
              <>
                <Link href={ROUTES.favorites}>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='gap-2 text-muted-foreground hover:text-primary'
                  >
                    <Heart className='h-4 w-4' />
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='sm' className='gap-2'>
                      <Avatar className='h-8 w-8'>
                        <AvatarImage src={user?.avatar} alt={userName} />
                        <AvatarFallback>{userInitial}</AvatarFallback>
                      </Avatar>
                      <span className='hidden lg:inline text-muted-foreground'>
                        {userName}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-56'>
                    <div className='px-2 py-1.5'>
                      <p className='text-sm font-medium'>{userName}</p>
                      <p className='text-xs text-muted-foreground'>{user?.email || ""}</p>
                    </div>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link
                          href={`${ROUTES.dashboard}/admin`}
                          className='cursor-pointer text-red-600'
                        >
                          <Shield className='mr-2 h-4 w-4' />
                          Админ-панель
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href={ROUTES.dashboard} className='cursor-pointer'>
                        <LayoutDashboard className='mr-2 h-4 w-4' />
                        Кабинет
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`${ROUTES.dashboard}/profile`}
                        className='cursor-pointer'
                      >
                        <UserCircle className='mr-2 h-4 w-4' />
                        Профиль
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={ROUTES.favorites} className='cursor-pointer'>
                        <Heart className='mr-2 h-4 w-4' />
                        Избранное
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`${ROUTES.dashboard}/listings`}
                        className='cursor-pointer'
                      >
                        <LayoutDashboard className='mr-2 h-4 w-4' />
                        Мои объявления
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className='cursor-pointer'>
                      <LogOut className='mr-2 h-4 w-4' />
                      Выход
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href={ROUTES.login}>
                <Button
                  variant='ghost'
                  size='sm'
                  className='gap-2 text-muted-foreground hover:text-primary'
                >
                  <User className='h-4 w-4' />
                  <span>Войти</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Sell Button - Always visible */}
          <Link href={ROUTES.sell}>
            <Button className='btn-caucasus h-9 px-3 md:px-4 gap-2'>
              <PlusCircle className='h-4 w-4' />
              <span className='hidden sm:inline text-sm'>Разместить</span>
              <span className='sm:hidden text-sm'>+</span>
            </Button>
          </Link>

          {/* Mobile Menu Button */}
          <button
            className='md:hidden p-2 hover:bg-muted rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center'
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300'
          onClick={handleOverlayClick}
          aria-hidden='true'
          role='button'
          tabIndex={-1}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-16 right-0 bottom-0 w-80 max-w-[85vw] md:hidden bg-background z-50 shadow-xl transition-transform duration-300 ease-in-out overflow-y-auto overscroll-contain will-change-transform ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={handleMenuClick}
      >
        <div className='px-4 py-6 space-y-4'>
          {/* Categories */}
          <div className='space-y-1'>
            <p className='px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              Категории
            </p>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className='flex px-4 py-3 text-sm rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors min-h-[44px] items-center'
                onClick={() => setMobileMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {isAuthenticated && (
            <div className='border-t pt-4 space-y-1'>
              <p className='px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                Аккаунт
              </p>
              {isAdmin && (
                <Link href={`${ROUTES.dashboard}/admin`}>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='w-full justify-start gap-2 text-red-600 min-h-[44px]'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className='h-4 w-4' />
                    <span>Админ-панель</span>
                  </Button>
                </Link>
              )}
              <Link href={`${ROUTES.dashboard}/profile`}>
                <Button
                  variant='ghost'
                  size='sm'
                  className='w-full justify-start gap-2 text-muted-foreground min-h-[44px]'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserCircle className='h-4 w-4' />
                  <span>Профиль</span>
                </Button>
              </Link>
              <Button
                variant='ghost'
                size='sm'
                className='w-full justify-start gap-2 text-muted-foreground min-h-[44px]'
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await handleLogout();
                }}
              >
                <LogOut className='h-4 w-4' />
                <span>Выход</span>
              </Button>
            </div>
          )}

          {!isAuthenticated && (
            <div className='border-t pt-4'>
              <Link href={ROUTES.login}>
                <Button
                  variant='ghost'
                  size='sm'
                  className='w-full justify-start gap-2 text-muted-foreground min-h-[44px]'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className='h-4 w-4' />
                  <span>Войти</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
