"use client";

import { use, useState } from "react";
import { PropertyGallery } from "@/components/features/property-gallery";
import { YandexMap } from "@/components/features/yandex-map";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Eye, Share2, Heart, Home, Square, Building2, Copy } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useProperty } from "@/hooks/use-properties";
import { useFavorites } from "@/hooks/use-favorites";
import { useCreatePropertyChat } from "@/hooks/use-chats";
import { useAuthStore } from "@/stores";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants";
import { formatDate, formatPhone, getPhoneHref } from "@/lib/utils/format";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: property, isLoading, error } = useProperty(id);

  const { isFavorite, toggleFavorite, isMutating } = useFavorites();
  const createChatMutation = useCreatePropertyChat();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const favorite = property ? isFavorite(property.id) : false;
  const isPending = property ? isMutating(property.id) : false;

  // For "show phone" button
  const [showPhone, setShowPhone] = useState(false);

  // For share functionality
  const [copied, setCopied] = useState(false);

  const handleFavoriteClick = () => {
    if (property) {
      toggleFavorite(property.id, property);
    }
  };

  console.log(property);



  const handleShowPhone = () => {
    setShowPhone(true);
  };

  const handleContactSeller = () => {
    if (typeof window !== "undefined" && property?.contact?.phone) {
      window.location.href = getPhoneHref(property.contact.phone);
    }
  };

  const handleCopyLink = async () => {
    if (typeof window !== "undefined") {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        setCopied(false);
      }
    }
  };

  const handleWriteToOwner = async () => {
    if (!isAuthenticated) {
      router.push(ROUTES.login);
      return;
    }

    if (!property) return;

    // Проверяем, не является ли пользователь владельцем
    if (user?.id === property.userId) {
      return; // Не показываем кнопку для владельца
    }

    try {
      const chat = await createChatMutation.mutateAsync(property.id);
      router.push(ROUTES.messages);
    } catch (error) {
      // Ошибка обработается в хуке
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 pb-12">
          {/* Навигационная цепочка */}
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-4" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-4" />
              <Skeleton className="h-5 w-40" />
            </div>
          </div>

          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              {/* Левая часть */}
              <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                {/* Заголовок и кнопки */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <Skeleton className="h-8 sm:h-10 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-11 w-11 rounded-lg" />
                      <Skeleton className="h-11 w-11 rounded-lg" />
                    </div>
                  </div>
                </div>

                {/* Галерея - Hero + Thumbs */}
                <div className="space-y-3">
                  <Skeleton className="aspect-video w-full rounded-xl" />
                  <div className="flex gap-2">
                    <Skeleton className="aspect-[4/3] flex-1 rounded-lg" />
                    <Skeleton className="aspect-[4/3] flex-1 rounded-lg" />
                    <Skeleton className="aspect-[4/3] flex-1 rounded-lg" />
                    <Skeleton className="aspect-[4/3] flex-1 rounded-lg" />
                  </div>
                </div>

                {/* Цена */}
                <Skeleton className="h-20 w-full rounded-xl" />

                {/* Характеристики */}
                <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                  <Skeleton className="h-6 w-32 mb-4 sm:mb-6" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 gap-x-4 sm:gap-x-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="flex justify-between items-baseline border-b border-border/50 pb-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Описание */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <Skeleton className="h-6 w-24 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              </div>

              {/* Правая часть - Сайдбар */}
              <div className="lg:col-span-4">
                <div className="sticky top-24">
                  <div className="bg-card rounded-xl border border-border p-4 sm:p-6 space-y-4">
                    {/* Цена */}
                    <div>
                      <Skeleton className="h-9 w-2/3 mb-2" />
                      <Skeleton className="h-5 w-1/2" />
                    </div>

                    {/* Информация */}
                    <div className="space-y-3 pt-4 border-t border-border">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-5 w-2/3" />
                    </div>

                    {/* Характеристики */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                      ))}
                    </div>

                    {/* Кнопки */}
                    <div className="space-y-2 pt-2">
                      <Skeleton className="h-11 w-full rounded-lg" />
                      <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className='container mx-auto px-4 py-12 text-center'>
        <h1 className='text-2xl font-bold mb-4'>Объявление не найдено</h1>
        <p className='text-muted-foreground'>
          {error?.message || "Объявление с таким ID не существует"}
        </p>
      </div>
    );
  }

  const pricePerMeter =
    property.pricePerMeter || Math.round(property.price / property.area);
  const images = property.images || [property.image];

  // карта
  // Вставьте сюда виджет карты (например, яндекс или google maps) по координатам property.latitude, property.longitude если есть

  return (
    <div className='min-h-screen flex flex-col bg-background'>
      <main className='flex-1 pb-12'>
        {/* Навигационная цепочка */}
        <div className='container mx-auto px-4 py-4'>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={ROUTES.home}>Главная</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={ROUTES.search}>Недвижимость</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{property.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className='container mx-auto px-4'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8'>
            {/* Основной контент */}
            <div className='lg:col-span-8 space-y-6 sm:space-y-8'>
              {/* Заголовок и адрес */}
              <div className='space-y-4'>
                <div className='flex flex-wrap items-start justify-between gap-4'>
                  <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-foreground text-balance flex-1 min-w-0'>
                    {property.title}
                  </h1>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='icon'
                      title='В избранное'
                      onClick={handleFavoriteClick}
                      disabled={isPending}
                      aria-label={favorite ? "Удалить из избранного" : "Добавить в избранное"}
                      className={`min-h-[44px] min-w-[44px] ${isPending ? "opacity-70" : ""}`}
                    >
                      <Heart
                        className={`w-5 h-5 transition-transform ${favorite ? "fill-current text-red-500 scale-110" : ""} ${isPending ? "animate-pulse" : ""}`}
                      />
                    </Button>
                    <div className="relative">
                      <Button
                        type="button"
                        variant='outline'
                        size='icon'
                        title='Поделиться'
                        aria-label="Поделиться"
                        className="min-h-[44px] min-w-[44px]"
                        onClick={handleCopyLink}
                      >
                        {copied ? (
                          <Copy className='w-5 h-5 text-green-500' />
                        ) : (
                          <Share2 className='w-5 h-5' />
                        )}
                      </Button>
                      {copied && (
                        <div className='absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-muted rounded text-xs text-muted-foreground shadow z-10'>
                          Ссылка скопирована
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Галерея */}
              <PropertyGallery images={images} />

              {/* Цена */}
              <div className='bg-card rounded-xl border border-border p-4 sm:p-6'>
                <div className='flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4'>
                  <span className='text-2xl sm:text-3xl font-bold text-foreground'>
                    {new Intl.NumberFormat("ru-RU", {
                      style: "currency",
                      currency: property.currency,
                      maximumFractionDigits: 0,
                    }).format(property.price)}
                  </span>
                  <span className='text-base sm:text-lg text-muted-foreground'>
                    {new Intl.NumberFormat("ru-RU", {
                      style: "currency",
                      currency: property.currency,
                      maximumFractionDigits: 0,
                    }).format(pricePerMeter)}
                    /м²
                  </span>
                </div>
              </div>

              {/* Характеристики */}
              <div className='bg-card rounded-xl border border-border p-4 sm:p-6'>
                <h2 className='text-lg sm:text-xl font-semibold mb-4 sm:mb-6'>Характеристики</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 gap-x-4 sm:gap-x-8'>
                  <div className='flex justify-between items-baseline border-b border-border/50 pb-2'>
                    <span className='text-muted-foreground'>Тип</span>
                    <span className='font-medium text-foreground'>
                      {property.type === "apartment"
                        ? "Квартира"
                        : property.type === "house"
                          ? "Дом"
                          : property.type === "land"
                            ? "Участок"
                            : "Коммерческая"}
                    </span>
                  </div>
                  <div className='flex justify-between items-baseline border-b border-border/50 pb-2'>
                    <span className='text-muted-foreground'>Площадь</span>
                    <span className='font-medium text-foreground'>
                      {property.area} м²
                    </span>
                  </div>
                  {property.rooms !== undefined && property.rooms !== null && (
                    <div className='flex justify-between items-baseline border-b border-border/50 pb-2'>
                      <span className='text-muted-foreground'>Комнат</span>
                      <span className='font-medium text-foreground'>
                        {property.rooms}
                      </span>
                    </div>
                  )}
                  {property.floor !== undefined && property.floor !== null && (
                    <div className='flex justify-between items-baseline border-b border-border/50 pb-2'>
                      <span className='text-muted-foreground'>Этаж</span>
                      <span className='font-medium text-foreground'>
                        {property.floor}
                      </span>
                    </div>
                  )}
                  <div className='flex justify-between items-baseline border-b border-border/50 pb-2'>
                    <span className='text-muted-foreground'>Регион</span>
                    <span className='font-medium text-foreground'>
                      {property.region}
                    </span>
                  </div>
                </div>
              </div>

              {/* Описание */}
              <div className='bg-card rounded-xl border border-border p-6'>
                <h2 className='text-xl font-semibold mb-4'>Описание</h2>
                <div className='prose prose-stone max-w-none text-muted-foreground whitespace-pre-line'>
                  {property.description}
                </div>
              </div>

              {/* Удобства */}
              {property.features && property.features.length > 0 && (
                <div className='bg-card rounded-xl border border-border p-6'>
                  <h2 className='text-xl font-semibold mb-4'>Удобства</h2>
                  <div className='flex flex-wrap gap-2'>
                    {property.features.map((feature, index) => (
                      <Badge key={index} variant='secondary'>
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Карта */}
              {property.latitude && property.longitude ? (
                <div className='bg-card rounded-xl border border-border p-6'>
                  <h2 className='text-xl font-semibold mb-4'>Расположение на карте</h2>
                  <YandexMap
                    latitude={property.latitude}
                    longitude={property.longitude}
                    zoom={15}
                    height={400}
                    markerTitle={property.title}
                  />
                </div>
              ) : (
                <div className='bg-card rounded-xl border border-border p-6'>
                  <h2 className='text-xl font-semibold mb-4'>Расположение на карте</h2>
                  <p className='text-muted-foreground text-sm'>
                    Координаты не указаны. Для отображения карты необходимо указать широту и долготу.
                  </p>
                </div>
              )}

              {/* Контакты */}
              <div className='bg-card rounded-xl border border-border p-6'>
                <h2 className='text-xl font-semibold mb-4'>Контакты</h2>
                <div className='space-y-2'>
                  <p className='text-foreground font-medium'>
                    {property.contact.name}
                  </p>
                  <a
                    href={getPhoneHref(property.contact.phone)}
                    className='text-muted-foreground hover:text-primary transition-colors block'
                  >
                    {formatPhone(property.contact.phone, "international")}
                  </a>
                </div>
              </div>
            </div>

            {/* Сайдбар */}
            <div className='lg:col-span-4'>
              <div className='sticky top-24 space-y-6'>
                <div className='bg-card rounded-xl border border-border p-4 sm:p-6'>
                  <div className='space-y-4'>
                    {/* Цена */}
                    <div>
                      <p className='text-2xl sm:text-3xl font-bold text-foreground'>
                        {new Intl.NumberFormat("ru-RU", {
                          style: "currency",
                          currency: property.currency,
                          maximumFractionDigits: 0,
                        }).format(property.price)}
                      </p>
                      <p className='text-xs sm:text-sm text-muted-foreground'>
                        {new Intl.NumberFormat("ru-RU", {
                          style: "currency",
                          currency: property.currency,
                          maximumFractionDigits: 0,
                        }).format(pricePerMeter)}
                        /м²
                      </p>
                    </div>

                    {/* Информация о публикации */}
                    <div className='space-y-3 pt-4 border-t border-border'>
                      {/* Адрес */}
                      <div className='flex items-start gap-2 text-sm text-muted-foreground'>
                        <MapPin className='w-4 h-4 shrink-0 mt-0.5' />
                        <span className='wrap-break-word'>{property.location}</span>
                      </div>

                      {/* Премиум badge */}
                      {property.isPremium && (
                        <div>
                          <Badge variant='secondary' className='rounded-md'>
                            Премиум
                          </Badge>
                        </div>
                      )}

                      {/* Дата и просмотры */}
                      <div className='flex flex-col gap-2 text-sm'>
                        {property.updatedAt && (
                          <div className='flex items-center gap-2 text-muted-foreground'>
                            <Calendar className='w-4 h-4 shrink-0' />
                            <span>
                              {formatDate(property.updatedAt, "ru-RU", { relative: true, includeTime: true })}
                            </span>
                          </div>
                        )}
                        {property.views !== undefined && (
                          <div className='flex items-center gap-2 text-muted-foreground'>
                            <Eye className='w-4 h-4 shrink-0' />
                            <span>{property.views} просмотров</span>
                          </div>
                        )}
                      </div>

                      {/* Основные характеристики */}
                      <div className='grid grid-cols-2 gap-2 pt-2'>
                        {property.rooms !== undefined && property.rooms !== null && (
                          <div className='flex items-center gap-2 p-2 rounded-lg bg-muted/50'>
                            <Home className='w-4 h-4 text-muted-foreground shrink-0' />
                            <div className='flex flex-col'>
                              <span className='text-xs text-muted-foreground'>Комнат</span>
                              <span className='text-sm font-medium'>{property.rooms}</span>
                            </div>
                          </div>
                        )}
                        <div className='flex items-center gap-2 p-2 rounded-lg bg-muted/50'>
                          <Square className='w-4 h-4 text-muted-foreground shrink-0' />
                          <div className='flex flex-col'>
                            <span className='text-xs text-muted-foreground'>Площадь</span>
                            <span className='text-sm font-medium'>{property.area} м²</span>
                          </div>
                        </div>
                        {property.floor !== undefined && property.floor !== null && (
                          <div className='flex items-center gap-2 p-2 rounded-lg bg-muted/50'>
                            <Building2 className='w-4 h-4 text-muted-foreground shrink-0' />
                            <div className='flex flex-col'>
                              <span className='text-xs text-muted-foreground'>Этаж</span>
                              <span className='text-sm font-medium'>{property.floor}</span>
                            </div>
                          </div>
                        )}
                        <div className='flex items-center gap-2 p-2 rounded-lg bg-muted/50'>
                          <Badge variant='secondary' className='text-xs'>
                            {property.type === "apartment"
                              ? "Квартира"
                              : property.type === "house"
                                ? "Дом"
                                : property.type === "land"
                                  ? "Участок"
                                  : "Коммерческая"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* CTA кнопки */}
                    <div className='space-y-2 pt-2'>
                      {/* Кнопка чата (только если пользователь не владелец) */}
                      {user?.id !== property.userId && (
                        <Button
                          className='w-full min-h-[44px]'
                          onClick={handleWriteToOwner}
                          disabled={createChatMutation.isPending}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {createChatMutation.isPending
                            ? "Создание чата..."
                            : "Написать владельцу"}
                        </Button>
                      )}
                      <Button
                        variant={user?.id === property.userId ? "default" : "outline"}
                        className='w-full min-h-[44px]'
                        onClick={handleContactSeller}
                        asChild={false}
                      >
                        Связаться с продавцом
                      </Button>
                      <Button
                        variant='outline'
                        className='w-full min-h-[44px]'
                        onClick={handleShowPhone}
                        disabled={showPhone}
                      >
                        {showPhone
                          ? formatPhone(property.contact.phone, "international")
                          : "Показать телефон"}
                      </Button>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
