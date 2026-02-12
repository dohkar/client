"use client";

import { useEffect } from "react";
import { usePathname, redirect } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ADMIN_TABS = [
  { href: "/dashboard/admin", label: "Обзор", exact: true },
  { href: "/dashboard/admin/users", label: "Пользователи" },
  { href: "/dashboard/admin/properties", label: "Объявления" },
  { href: "/dashboard/admin/inbox", label: "Входящие" },
  { href: "/dashboard/admin/chats", label: "Чаты" },
  { href: "/dashboard/admin/logs", label: "Логи" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, isInitialized } = useAuthStore();

  // Проверка роли админа
  const backofficeRoles = ["ADMIN"];
  const isBackoffice = user?.role && backofficeRoles.includes(user.role.toUpperCase());

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      redirect("/auth/login");
    } else if (!isBackoffice) {
      redirect("/dashboard");
    }
  }, [isAuthenticated, isBackoffice, isInitialized]);

  // Показываем загрузку пока store не инициализирован
  if (!isInitialized) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto' />
          <p className='text-sm text-muted-foreground'>Загрузка...</p>
        </div>
      </div>
    );
  }

  // Не рендерим контент если не админ (редирект произойдёт)
  if (!isAuthenticated || !isBackoffice) {
    return null;
  }

  return (
    <div className='min-h-screen bg-muted/30'>
      <div className='container mx-auto px-4 py-6 sm:py-8 md:py-12'>
        <div className='mb-6 sm:mb-8'>
          <h1 className='text-2xl sm:text-3xl font-bold text-foreground mb-2'>
            Админ панель
          </h1>
        </div>

        {/* Tabs as Links */}
        <div className='flex gap-2 mb-6 border-b overflow-x-auto'>
          <div className='flex gap-2 min-w-max'>
            {ADMIN_TABS.map((tab) => {
              const isActive = tab.exact
                ? pathname === tab.href
                : pathname?.startsWith(tab.href);

              return (
                <Link key={tab.href} href={tab.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className='min-h-[44px] whitespace-nowrap'
                  >
                    {tab.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
