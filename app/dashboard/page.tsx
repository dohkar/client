"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";
import { useAuthStore } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Heart, MessageSquare, Settings, Shield, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { propertyService } from "@/services/property.service";
import { favoritesService } from "@/services/favorites.service";
import { useChatsList } from "@/hooks/use-chats";
import { ROUTES } from "@/constants";

export default function DashboardPage() {
  const { isAuthenticated, user, isInitialized, isLoading } = useAuthStore();

  useEffect(() => {
    // Ждем завершения инициализации перед проверкой
    if (isInitialized && !isAuthenticated) {
      redirect(ROUTES.login);
    }
  }, [isAuthenticated, isInitialized]);

  const { data: propertiesMeta } = useQuery({
    queryKey: queryKeys.properties.list({ my: true }),
    queryFn: async () => {
      const response = await propertyService.getProperties({
        my: true,
        limit: 1,
        page: 1,
      });
      return { total: response.total ?? 0 };
    },
    enabled: !!user && isAuthenticated && isInitialized,
  });

  const propertiesCount = propertiesMeta?.total ?? 0;

  const { data: favorites } = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: async () => {
      const response = await favoritesService.getFavorites();
      return response || [];
    },
    enabled: isAuthenticated && isInitialized,
  });

  const { data: chats, isLoading: chatsLoading } = useChatsList();

  // Показываем загрузку во время инициализации
  if (!isInitialized || isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-muted-foreground'>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const stats = [
    {
      title: "Мои объявления",
      value: propertiesCount,
      icon: Home,
      href: "/dashboard/listings",
      color: "text-primary",
    },
    {
      title: "Избранное",
      value: favorites?.length || 0,
      icon: Heart,
      href: "/favorites",
      color: "text-destructive",
    },
    {
      title: "Сообщения",
      value: chatsLoading
        ? "..."
        : chats
          ? chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0) || chats.length
          : 0,
      icon: MessageSquare,
      href: "/messages",
      color: "text-accent",
    },
    ...(user?.role && user.role.toUpperCase() === "ADMIN"
      ? [
          {
            title: "Админ панель",
            value: "→",
            icon: Shield,
            href: "/dashboard/admin",
            color: "text-primary",
          },
        ]
      : []),
  ];

  return (
    <div className='min-h-[calc(100vh-65px)]'>
      <div className='container mx-auto px-4 py-6 sm:py-8 md:py-12'>
        <div className='max-w-6xl mx-auto'>
          <div className='mb-6 sm:mb-8'>
            <h1 className='text-2xl sm:text-3xl font-bold text-foreground mb-2'>
              Личный кабинет
            </h1>
            <p className='text-sm sm:text-base text-muted-foreground'>
              Управляйте своими объявлениями и настройками
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8'>
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link key={stat.title} href={stat.href}>
                  <Card className='hover:shadow-lg transition-shadow cursor-pointer border-primary/20'>
                    <CardContent className='p-4 sm:p-6'>
                      <div className='flex items-center justify-between mb-3 sm:mb-4'>
                        <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.color}`} />
                        <span className='text-2xl sm:text-3xl font-bold'>
                          {stat.value}
                        </span>
                      </div>
                      <p className='text-sm sm:text-base text-muted-foreground'>
                        {stat.title}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <Card className='border-primary/20'>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
              <Link href={ROUTES.sell} className='flex-1'>
                <Button className='w-full btn-caucasus min-h-[44px]'>
                  <Home className='w-4 h-4 mr-2' />
                  <span className='text-sm sm:text-base'>Разместить объявление</span>
                </Button>
              </Link>
              <Link href={`${ROUTES.dashboard}/profile`} className='flex-1'>
                <Button variant='outline' className='w-full min-h-[44px]'>
                  <Settings className='w-4 h-4 mr-2' />
                  <span className='text-sm sm:text-base'>Профиль</span>
                </Button>
              </Link>
              <Link href={ROUTES.dashboardSupport} className='flex-1'>
                <Button variant='outline' className='w-full min-h-[44px]'>
                  <HelpCircle className='w-4 h-4 mr-2' />
                  <span className='text-sm sm:text-base'>Поддержка</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
