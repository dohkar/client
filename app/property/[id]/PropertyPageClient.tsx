"use client";

import { use, useState } from "react";
import dynamic from "next/dynamic";
import { PropertyGallery } from "@/components/features/property-gallery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Calendar,
  Eye,
  Share2,
  Heart,
  Home,
  Square,
  Building2,
  Copy,
} from "lucide-react";
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
import { ROUTES } from "@/constants";
import { formatDate, formatPhone, getPhoneHref } from "@/lib/utils/format";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logger } from "@/lib/utils/logger";
import type { Property } from "@/types/property";
import { generatePropertyJsonLd } from "@/lib/json-ld";

// Динамический импорт YandexMap без SSR
const YandexMap = dynamic(
  () => import("@/components/features/yandex-map").then((mod) => mod.YandexMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    ),
  }
);

interface PropertyPageClientProps {
  params: Promise<{ id: string }>;
  initialData?: Property | null;
}

export default function PropertyPageClient({
  params,
  initialData,
}: PropertyPageClientProps) {
  const { id } = use(params);
  const router = useRouter();
  
  // Используем initialData если есть, иначе загружаем через React Query
  const { data: property, isLoading, error } = useProperty(id);
  const propertyData = initialData || property;

  const { isFavorite, toggleFavorite, isMutating } = useFavorites();
  const createChatMutation = useCreatePropertyChat();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const favorite = propertyData ? isFavorite(propertyData.id) : false;
  const isPending = propertyData ? isMutating(propertyData.id) : false;

  // For "show phone" button
  const [showPhone, setShowPhone] = useState(false);

  // For share functionality
  const [copied, setCopied] = useState(false);

  // Complaint modal state
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintReason, setComplaintReason] = useState<string>("");
  const [complaintComment, setComplaintComment] = useState<string>("");
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);

  const handleFavoriteClick = () => {
    if (propertyData) {
      toggleFavorite(propertyData.id, propertyData);
    }
  };

  const handleShowPhone = () => {
    setShowPhone(true);
  };

  const handleContactSeller = () => {
    if (typeof window !== "undefined" && propertyData?.contact?.phone) {
      window.location.href = getPhoneHref(propertyData.contact.phone);
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

    if (!propertyData) return;

    // Проверяем, не является ли пользователь владельцем
    if (user?.id === propertyData.userId) {
      return;
    }

    try {
      const chat = await createChatMutation.mutateAsync(propertyData.id);
      router.push(`${ROUTES.messages}?chatId=${chat.id}`);
    } catch (error) {
      // Ошибка обработается в хуке
    }
  };

  const handleSubmitComplaint = async () => {
    if (!propertyData) return;
    if (!isAuthenticated) {
      router.push(ROUTES.login);
      return;
    }

    if (!complaintReason) {
      toast.error("Выберите причину жалобы");
      return;
    }

    try {
      setComplaintSubmitting(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const message = `Жалоба на объявление ${propertyData.id}\nПричина: ${complaintReason}\nКомментарий: ${complaintComment || "-"}`;

      const res = await fetch(`${API_URL}/api/inbox`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category: "COMPLAINT",
          severity: "MEDIUM",
          name: user?.name || "Пользователь",
          email: user?.email || undefined,
          phone: user?.phone || undefined,
          message,
          propertyId: propertyData.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit complaint");
      }

      toast.success("Жалоба отправлена");
      setComplaintOpen(false);
      setComplaintReason("");
      setComplaintComment("");
    } catch (error) {
      logger.error("Failed to submit complaint", error);
      toast.error("Не удалось отправить жалобу");
    } finally {
      setComplaintSubmitting(false);
    }
  };

  if (isLoading && !initialData) {
    // Loading state handled by loading.tsx
    return null;
  }

  if (error || !propertyData) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Объявление не найдено</h1>
        <p className="text-muted-foreground">
          {error?.message || "Объявление с таким ID не существует"}
        </p>
      </div>
    );
  }

  const pricePerMeter =
    propertyData.pricePerMeter || Math.round(propertyData.price / propertyData.area);
  const images = propertyData.images || [propertyData.image];

  // JSON-LD для SEO
  const jsonLd = generatePropertyJsonLd(propertyData);

  return (
    <>
      {/* Структурированные данные для поисковых систем */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 pb-12">
        {/* Навигационная цепочка */}
        <div className="container mx-auto px-4 py-4">
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
                <BreadcrumbPage>{propertyData.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Основной контент */}
            <div className="lg:col-span-8 space-y-6 sm:space-y-8">
              {/* Заголовок и адрес */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground text-balance flex-1 min-w-0">
                    {propertyData.title}
                  </h1>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      title="В избранное"
                      onClick={handleFavoriteClick}
                      disabled={isPending}
                      aria-label={
                        favorite ? "Удалить из избранного" : "Добавить в избранное"
                      }
                      className={`min-h-[44px] min-w-[44px] ${isPending ? "opacity-70" : ""}`}
                    >
                      <Heart
                        className={`w-5 h-5 transition-transform ${favorite ? "fill-current text-red-500 scale-110" : ""} ${isPending ? "animate-pulse" : ""}`}
                      />
                    </Button>
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title="Поделиться"
                        aria-label="Поделиться"
                        className="min-h-[44px] min-w-[44px]"
                        onClick={handleCopyLink}
                      >
                        {copied ? (
                          <Copy className="w-5 h-5 text-green-500" />
                        ) : (
                          <Share2 className="w-5 h-5" />
                        )}
                      </Button>
                      {copied && (
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-muted rounded text-xs text-muted-foreground shadow z-10">
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
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">
                    {new Intl.NumberFormat("ru-RU", {
                      style: "currency",
                      currency: propertyData.currency,
                      maximumFractionDigits: 0,
                    }).format(propertyData.price)}
                  </span>
                  <span className="text-base sm:text-lg text-muted-foreground">
                    {new Intl.NumberFormat("ru-RU", {
                      style: "currency",
                      currency: propertyData.currency,
                      maximumFractionDigits: 0,
                    }).format(pricePerMeter)}
                    /м²
                  </span>
                </div>
              </div>

              {/* Характеристики */}
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
                  Характеристики
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 gap-x-4 sm:gap-x-8">
                  <div className="flex justify-between items-baseline border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Тип</span>
                    <span className="font-medium text-foreground">
                      {propertyData.type === "apartment"
                        ? "Квартира"
                        : propertyData.type === "house"
                          ? "Дом"
                          : propertyData.type === "land"
                            ? "Участок"
                            : "Коммерческая"}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Площадь</span>
                    <span className="font-medium text-foreground">
                      {propertyData.area} м²
                    </span>
                  </div>
                  {propertyData.rooms !== undefined && propertyData.rooms !== null && (
                    <div className="flex justify-between items-baseline border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Комнат</span>
                      <span className="font-medium text-foreground">
                        {propertyData.rooms}
                      </span>
                    </div>
                  )}
                  {propertyData.floor !== undefined && propertyData.floor !== null && (
                    <div className="flex justify-between items-baseline border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Этаж</span>
                      <span className="font-medium text-foreground">
                        {propertyData.floor}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Регион</span>
                    <span className="font-medium text-foreground">
                      {propertyData.region}
                    </span>
                  </div>
                </div>
              </div>

              {/* Описание */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-semibold mb-4">Описание</h2>
                <div className="prose prose-stone max-w-none text-muted-foreground whitespace-pre-line">
                  {propertyData.description}
                </div>
              </div>

              {/* Удобства */}
              {propertyData.features && propertyData.features.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="text-xl font-semibold mb-4">Удобства</h2>
                  <div className="flex flex-wrap gap-2">
                    {propertyData.features.map((feature, index) => (
                      <Badge key={index} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Карта */}
              {propertyData.latitude && propertyData.longitude ? (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="text-xl font-semibold mb-4">Расположение на карте</h2>
                  <YandexMap
                    latitude={propertyData.latitude}
                    longitude={propertyData.longitude}
                    zoom={15}
                    height={400}
                    markerTitle={propertyData.title}
                  />
                </div>
              ) : (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="text-xl font-semibold mb-4">Расположение на карте</h2>
                  <p className="text-muted-foreground text-sm">
                    Координаты не указаны. Для отображения карты необходимо указать широту
                    и долготу.
                  </p>
                </div>
              )}

              {/* Контакты */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-semibold mb-4">Контакты</h2>
                <div className="space-y-2">
                  <p className="text-foreground font-medium">{propertyData.contact.name}</p>
                  <a
                    href={getPhoneHref(propertyData.contact.phone)}
                    className="text-muted-foreground hover:text-primary transition-colors block"
                  >
                    {formatPhone(propertyData.contact.phone, "international")}
                  </a>
                </div>
              </div>
            </div>

            {/* Сайдбар */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Цена */}
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold text-foreground">
                        {new Intl.NumberFormat("ru-RU", {
                          style: "currency",
                          currency: propertyData.currency,
                          maximumFractionDigits: 0,
                        }).format(propertyData.price)}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {new Intl.NumberFormat("ru-RU", {
                          style: "currency",
                          currency: propertyData.currency,
                          maximumFractionDigits: 0,
                        }).format(pricePerMeter)}
                        /м²
                      </p>
                    </div>

                    {/* Информация о публикации */}
                    <div className="space-y-3 pt-4 border-t border-border">
                      {/* Адрес */}
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="wrap-break-word">{propertyData.location}</span>
                      </div>

                      {/* Премиум badge */}
                      {propertyData.isPremium && (
                        <div>
                          <Badge variant="secondary" className="rounded-md">
                            Премиум
                          </Badge>
                        </div>
                      )}

                      {/* Дата и просмотры */}
                      <div className="flex flex-col gap-2 text-sm">
                        {propertyData.updatedAt && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4 shrink-0" />
                            <span>
                              {formatDate(propertyData.updatedAt, "ru-RU", {
                                relative: true,
                                includeTime: true,
                              })}
                            </span>
                          </div>
                        )}
                        {propertyData.views !== undefined && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Eye className="w-4 h-4 shrink-0" />
                            <span>{propertyData.views} просмотров</span>
                          </div>
                        )}
                      </div>

                      {/* Основные характеристики */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {propertyData.rooms !== undefined && propertyData.rooms !== null && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Home className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Комнат</span>
                              <span className="text-sm font-medium">
                                {propertyData.rooms}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Площадь</span>
                            <span className="text-sm font-medium">
                              {propertyData.area} м²
                            </span>
                          </div>
                        </div>
                        {propertyData.floor !== undefined && propertyData.floor !== null && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Этаж</span>
                              <span className="text-sm font-medium">
                                {propertyData.floor}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <Badge variant="secondary" className="text-xs">
                            {propertyData.type === "apartment"
                              ? "Квартира"
                              : propertyData.type === "house"
                                ? "Дом"
                                : propertyData.type === "land"
                                  ? "Участок"
                                  : "Коммерческая"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* CTA кнопки */}
                    <div className="space-y-2 pt-2">
                      {/* Кнопка чата (только если пользователь не владелец) */}
                      {user?.id !== propertyData.userId && (
                        <Button
                          className="w-full min-h-[44px]"
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
                        variant={user?.id === propertyData.userId ? "default" : "outline"}
                        className="w-full min-h-[44px]"
                        onClick={handleContactSeller}
                        asChild={false}
                      >
                        Связаться с продавцом
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full min-h-[44px]"
                        onClick={handleShowPhone}
                        disabled={showPhone}
                      >
                        {showPhone
                          ? formatPhone(propertyData.contact.phone, "international")
                          : "Показать телефон"}
                      </Button>

                      {/* Жалоба (только на странице объявления) */}
                      <div className="pt-2">
                        <Dialog open={complaintOpen} onOpenChange={setComplaintOpen}>
                          <DialogTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Flag className="h-4 w-4" />
                              Пожаловаться
                            </button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Пожаловаться на объявление</DialogTitle>
                              <DialogDescription>
                                Выберите причину и при желании добавьте комментарий.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3">
                              <div className="space-y-2">
                                <div className="text-sm font-medium">Причина</div>
                                <Select
                                  value={complaintReason}
                                  onValueChange={setComplaintReason}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Выберите причину" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="SCAM">Мошенничество</SelectItem>
                                    <SelectItem value="WRONG_INFO">
                                      Недостоверная информация
                                    </SelectItem>
                                    <SelectItem value="DUPLICATE">Дубликат</SelectItem>
                                    <SelectItem value="SPAM">Спам</SelectItem>
                                    <SelectItem value="OTHER">Другое</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <div className="text-sm font-medium">
                                  Комментарий (опционально)
                                </div>
                                <Textarea
                                  value={complaintComment}
                                  onChange={(e) => setComplaintComment(e.target.value)}
                                  placeholder="Опишите проблему..."
                                />
                              </div>
                            </div>

                            <DialogFooter>
                              <Button
                                variant="outline"
                                type="button"
                                onClick={() => setComplaintOpen(false)}
                                disabled={complaintSubmitting}
                              >
                                Отмена
                              </Button>
                              <Button
                                type="button"
                                onClick={handleSubmitComplaint}
                                disabled={complaintSubmitting}
                              >
                                {complaintSubmitting ? "Отправка..." : "Отправить"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </>
  );
}
