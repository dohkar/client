"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter, notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Heart, MapPin, MessageSquare, Phone, Share2 } from "lucide-react";
import type { Swiper as SwiperClass } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCard } from "@/components/features/property-card";
import type { ApiPropertyGetByIdParams } from "@/lib/api-types";
import { propertyTypedService } from "@/services/property-typed.service";
import { adaptProperty } from "@/lib/property-adapter";
import { queryKeys } from "@/lib/react-query/query-keys";
import { formatPrice } from "@/lib/utils/format";
import { ROUTES } from "@/constants";
import { useAuthStore } from "@/stores";
import { useFavorites } from "@/hooks/use-favorites";
import { useCreateListingChat } from "@/hooks/use-chats";
import type { Property, PropertyBackend, PropertyDealType } from "@/types/property";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractPropertyIdFromSegment(segment: string | undefined): string | undefined {
  if (!segment?.trim()) return undefined;
  const s = segment.trim();
  if (UUID_REGEX.test(s)) return s;
  if (s.length > 36 && s[36] === "-" && UUID_REGEX.test(s.slice(0, 36))) {
    return s.slice(0, 36);
  }
  return s;
}

const DEAL_LABELS: Record<PropertyDealType, string> = {
  SALE: "Продам",
  BUY: "Куплю",
  RENT_OUT: "Сдам",
  RENT_IN: "Сниму",
  EXCHANGE: "Обмен",
};

const TYPE_LABELS: Record<Property["type"], string> = {
  apartment: "Квартира",
  house: "Дом",
  land: "Участок",
  commercial: "Коммерция",
};

const REGION_LABELS: Record<Property["region"], string> = {
  Chechnya: "Чечня",
  Ingushetia: "Ингушетия",
  Other: "Другой регион",
};

function formatStatusLabel(status: PropertyBackend["status"]): string {
  const m: Record<string, string> = {
    ACTIVE: "Активно",
    PENDING: "На модерации",
    REJECTED: "Отклонено",
    SOLD: "Продано",
    ARCHIVED: "В архиве",
  };
  return m[status] ?? status;
}

function SpecCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='min-w-0 space-y-1'>
      <p className='text-xs text-muted-foreground'>{label}</p>
      <p className='text-sm font-semibold text-foreground'>{value}</p>
    </div>
  );
}

function SheetSpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex justify-between gap-4 border-b border-border/70 py-2.5 text-sm last:border-0'>
      <span className='text-muted-foreground shrink-0'>{label}</span>
      <span className='font-medium text-right'>{value}</span>
    </div>
  );
}

function StickyActionsCard({
  property,
  sellerAvatarUrl,
  sellerJoinedYear,
  onCall,
  onWrite,
  isChatPending,
}: {
  property: Property;
  sellerAvatarUrl?: string | null;
  sellerJoinedYear?: number | null;
  onCall: () => void;
  onWrite: () => void;
  isChatPending: boolean;
}) {
  const initials = property.contact.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className='rounded-xl border border-border bg-card p-5 shadow-sm'>
      <p className='text-3xl font-bold text-primary'>
        {formatPrice(property.price, property.currency)}
      </p>
      {property.pricePerMeter != null && property.area > 0 && (
        <p className='mt-1 text-sm text-muted-foreground'>
          {formatPrice(property.pricePerMeter, property.currency)} / м²
        </p>
      )}
      <Separator className='my-4' />
      <div className='flex items-center gap-3'>
        <Avatar className='h-12 w-12'>
          <AvatarImage src={sellerAvatarUrl ?? undefined} />
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>
        <div className='min-w-0'>
          <p className='truncate font-medium'>{property.contact.name}</p>
          {sellerJoinedYear != null && (
            <p className='text-xs text-muted-foreground'>
              на Dohkar с {sellerJoinedYear}
            </p>
          )}
        </div>
      </div>
      <div className='mt-4 flex flex-col gap-2'>
        <Button className='w-full min-h-11' onClick={onCall}>
          <Phone className='mr-2 h-4 w-4' />
          Позвонить
        </Button>
        <Button
          variant='outline'
          className='w-full min-h-11'
          onClick={onWrite}
          disabled={isChatPending || !property.listingId}
        >
          <MessageSquare className='mr-2 h-4 w-4' />
          Написать
        </Button>
        {!property.listingId && (
          <p className='text-xs text-muted-foreground'>
            Чат по объявлению доступен после привязки к каталогу листингов.
          </p>
        )}
      </div>
      <p className='mt-3 text-center text-xs text-muted-foreground'>
        Безопасная сделка через Dohkar
      </p>
    </div>
  );
}

export function PropertyDetailClient() {
  const params = useParams();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const createChatMutation = useCreateListingChat();
  const { isFavorite, isMutating, toggleFavorite } = useFavorites();

  const segment = typeof params.id === "string" ? params.id : undefined;
  const propertyId = extractPropertyIdFromSegment(segment);

  const [mainSlide, setMainSlide] = useState(0);
  const mainSwiperRef = useRef<SwiperClass | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    data: rawBackend,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.properties.detail(propertyId ?? ""),
    queryFn: () =>
      propertyTypedService.getPropertyById({
        id: propertyId!,
      } as ApiPropertyGetByIdParams),
    enabled: !!propertyId,
    staleTime: 30_000,
  });

  const property = useMemo(
    () => (rawBackend ? adaptProperty(rawBackend as PropertyBackend) : null),
    [rawBackend]
  );

  const { data: relatedRaw = [] } = useQuery({
    queryKey: [...queryKeys.properties.detail(propertyId ?? ""), "related", 8],
    queryFn: () => propertyTypedService.getRelatedProperties(propertyId!, 8),
    enabled: !!propertyId && !!property,
  });

  const related = useMemo(
    () => relatedRaw.map((r) => adaptProperty(r)).filter((p) => p.id !== propertyId),
    [relatedRaw, propertyId]
  );

  const images = useMemo(() => {
    if (!property?.images?.length) return [property?.image || "/placeholder.svg"];
    return property.images;
  }, [property]);

  const listingIdForFavorite = property?.listingId ?? null;
  const favorite = listingIdForFavorite ? isFavorite(listingIdForFavorite) : false;
  const favoritePending =
    !!listingIdForFavorite && isAuthenticated && isMutating(listingIdForFavorite);

  const handleFavorite = () => {
    if (!listingIdForFavorite) {
      toast.message("Избранное доступно для объявлений из каталога листингов");
      return;
    }
    toggleFavorite(listingIdForFavorite);
  };

  const handleCall = () => {
    const tel = property?.contact.phone?.replace(/\s/g, "");
    if (tel && tel !== "Не указано") {
      window.location.href = `tel:${tel}`;
    } else {
      toast.error("Телефон не указан");
    }
  };

  const handleWrite = async () => {
    if (!property?.listingId) {
      toast.error("Чат недоступен для этого объявления");
      return;
    }
    if (!isAuthenticated) {
      router.push(ROUTES.login);
      return;
    }
    try {
      const chat = await createChatMutation.mutateAsync(property.listingId);
      if (chat?.id) {
        router.push(`${ROUTES.messages}?chatId=${chat.id}`);
      }
    } catch {
      /* toast в хуке */
    }
  };

  const copyLink = useCallback(() => {
    if (typeof window === "undefined" || !segment) return;
    const url = `${window.location.origin}/property/${segment}`;
    void navigator.clipboard.writeText(url).then(
      () => toast.success("Ссылка скопирована"),
      () => toast.error("Не удалось скопировать")
    );
  }, [segment]);

  if (!propertyId) {
    notFound();
  }

  if (!isLoading && (error || !property)) {
    notFound();
  }

  if (isLoading || !property) {
    return (
      <div className='mx-auto max-w-7xl px-4 py-6'>
        <Skeleton className='mb-4 h-9 w-32' />
        <div className='grid gap-6 md:grid-cols-[1fr_1fr_340px]'>
          <Skeleton className='aspect-4/3 rounded-xl' />
          <div className='space-y-3'>
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-32 w-full' />
          </div>
          <Skeleton className='h-80 rounded-xl' />
        </div>
      </div>
    );
  }

  const p = property;
  const raw = rawBackend as PropertyBackend;
  const sellerAvatarUrl =
    raw.user &&
    typeof raw.user === "object" &&
    "avatar" in raw.user &&
    typeof raw.user.avatar === "string"
      ? raw.user.avatar
      : undefined;
  const sellerJoinedYear =
    raw.user &&
    typeof raw.user === "object" &&
    "createdAt" in raw.user &&
    typeof (raw.user as { createdAt?: string }).createdAt === "string"
      ? new Date((raw.user as { createdAt: string }).createdAt).getFullYear()
      : null;
  const featurePreview = p.features.slice(0, 3);
  const featureRest = Math.max(0, p.features.length - 3);
  const descriptionLines = p.description.split("\n");
  const needsDescriptionExpand =
    p.description.length > 160 || descriptionLines.length > 3;

  return (
    <div className='mx-auto max-w-7xl px-4 py-6'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
        <Button variant='ghost' size='sm' onClick={() => router.back()} className='-ml-2'>
          <ArrowLeft className='mr-1.5 h-4 w-4' />
          Назад
        </Button>
        <div className='flex items-center gap-1'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='min-h-11 min-w-11'
            onClick={copyLink}
            aria-label='Скопировать ссылку'
          >
            <Share2 className='h-5 w-5' />
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px] lg:items-start'>
        {/* ——— Колонка 1: галерея ——— */}
        <div className='order-1 min-w-0 lg:order-none'>
          <div className='relative aspect-4/3 w-full max-lg:max-h-[min(70vw,420px)] overflow-hidden rounded-xl bg-muted lg:max-h-[min(520px,calc(100dvh-11rem))]'>
            {images.length > 1 ? (
              <Swiper
                modules={[Navigation]}
                navigation
                spaceBetween={0}
                slidesPerView={1}
                className='h-full w-full'
                onSwiper={(instance) => {
                  mainSwiperRef.current = instance;
                }}
                onSlideChange={(sw) => setMainSlide(sw.activeIndex)}
              >
                {images.map((src, i) => (
                  <SwiperSlide key={i} className='!h-full'>
                    <Image
                      src={src || "/placeholder.svg"}
                      alt={`${p.title} — фото ${i + 1}`}
                      fill
                      className='object-cover'
                      sizes='(max-width: 1024px) 100vw, 33vw'
                      priority={i === 0}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <Image
                src={images[0] || "/placeholder.svg"}
                alt={p.title}
                fill
                className='object-cover'
                sizes='(max-width: 1024px) 100vw, 33vw'
                priority
              />
            )}
            <Button
              type='button'
              size='icon'
              variant='secondary'
              className={`absolute top-3 right-3 z-10 min-h-11 min-w-11 rounded-full shadow-md backdrop-blur-sm ${
                favorite
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : "bg-background/90"
              }`}
              onClick={handleFavorite}
              disabled={favoritePending}
              aria-label={favorite ? "Убрать из избранного" : "В избранное"}
            >
              <Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
            </Button>
          </div>

          {images.length > 1 && (
            <div className='mt-3'>
              <Swiper
                modules={[FreeMode]}
                freeMode
                spaceBetween={8}
                slidesPerView='auto'
                className='!overflow-visible'
              >
                {images.map((src, i) => (
                  <SwiperSlide key={i} style={{ width: 72 }} className='!h-auto'>
                    <button
                      type='button'
                      onClick={() => {
                        setMainSlide(i);
                        mainSwiperRef.current?.slideTo(i);
                      }}
                      className={`relative block h-14 w-full overflow-hidden rounded-lg border-2 transition ${
                        mainSlide === i
                          ? "border-primary"
                          : "border-transparent opacity-80"
                      }`}
                    >
                      <Image
                        src={src || "/placeholder.svg"}
                        alt=''
                        fill
                        className='object-cover'
                        sizes='72px'
                      />
                    </button>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </div>

        {/* ——— Мобильная цена + CTA ——— */}
        <div className='order-2 lg:hidden'>
          <StickyActionsCard
            property={p}
            sellerAvatarUrl={sellerAvatarUrl}
            sellerJoinedYear={sellerJoinedYear}
            onCall={handleCall}
            onWrite={handleWrite}
            isChatPending={createChatMutation.isPending}
          />
        </div>

        {/* ——— Колонка 2: информация ——— */}
        <div className='order-3 flex min-w-0 flex-col gap-4 lg:order-none'>
          <div className='flex flex-wrap gap-2'>
            <Badge variant='secondary'>{DEAL_LABELS[p.dealType]}</Badge>
            <Badge variant='outline'>{TYPE_LABELS[p.type]}</Badge>
          </div>
          <h1 className='text-2xl font-bold tracking-tight text-foreground'>{p.title}</h1>
          <div className='flex items-start gap-2 text-muted-foreground'>
            <MapPin className='mt-0.5 h-4 w-4 shrink-0' />
            <span className='text-sm'>
              {p.location}
              {p.city ? ` · ${p.city}` : ""} · {REGION_LABELS[p.region]}
            </span>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <SpecCell label='Тип' value={TYPE_LABELS[p.type]} />
            <SpecCell label='Комнаты' value={p.rooms != null ? String(p.rooms) : "—"} />
            <SpecCell label='Площадь' value={`${p.area} м²`} />
            <SpecCell label='Этаж' value={p.floor != null ? String(p.floor) : "—"} />
          </div>

          {p.features.length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {featurePreview.map((f) => (
                <Badge key={f} variant='outline'>
                  {f}
                </Badge>
              ))}
              {featureRest > 0 && <Badge variant='secondary'>+{featureRest} ещё</Badge>}
            </div>
          )}

          <Button
            variant='outline'
            className='w-full sm:w-auto'
            onClick={() => setSheetOpen(true)}
          >
            Все характеристики →
          </Button>

          <div>
            <div
              className={
                !needsDescriptionExpand || descExpanded
                  ? "whitespace-pre-wrap text-sm text-foreground"
                  : "line-clamp-3 text-sm text-foreground"
              }
            >
              {p.description}
            </div>
            {needsDescriptionExpand && (
              <Button
                variant='link'
                className='mt-1 h-auto p-0 text-primary'
                onClick={() => setDescExpanded((v) => !v)}
              >
                {descExpanded ? "Свернуть" : "Читать далее"}
              </Button>
            )}
          </div>

          <p className='text-sm text-muted-foreground'>
            Опубликовано {new Date(p.createdAt).toLocaleDateString("ru-RU")} · {p.views}{" "}
            просмотров
          </p>

          {/* Продавец внизу на мобиле */}
          <div className='rounded-xl border border-border p-4 lg:hidden'>
            <p className='mb-2 text-xs font-medium uppercase text-muted-foreground'>
              Продавец
            </p>
            <div className='flex items-center gap-3'>
              <Avatar className='h-11 w-11'>
                <AvatarImage src={sellerAvatarUrl ?? undefined} />
                <AvatarFallback>
                  {p.contact.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className='font-medium'>{p.contact.name}</p>
                {sellerJoinedYear != null && (
                  <p className='text-xs text-muted-foreground'>
                    на Dohkar с {sellerJoinedYear}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ——— Колонка 3: sticky desktop ——— */}
        <div className='order-4 hidden min-w-0 lg:order-none lg:block'>
          <div className='sticky top-6'>
            <StickyActionsCard
              property={p}
              sellerAvatarUrl={sellerAvatarUrl}
              sellerJoinedYear={sellerJoinedYear}
              onCall={handleCall}
              onWrite={handleWrite}
              isChatPending={createChatMutation.isPending}
            />
          </div>
        </div>
      </div>

      {/* Похожие */}
      {related.length > 0 && (
        <section className='mt-12 border-t border-border pt-10'>
          <h2 className='mb-4 text-xl font-semibold'>Похожие объявления</h2>
          <Swiper
            modules={[FreeMode]}
            freeMode
            spaceBetween={16}
            slidesPerView={2.5}
            breakpoints={{
              1024: { slidesPerView: 4 },
            }}
            className='pb-2'
          >
            {related.map((item) => (
              <SwiperSlide key={item.id} className='!h-auto'>
                <PropertyCard property={item} />
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side='right' className='flex w-full flex-col p-0 sm:max-w-[480px]'>
          <SheetHeader className='shrink-0 border-b px-4 py-4 pr-12'>
            <SheetTitle>Все характеристики</SheetTitle>
            <SheetDescription>{p.title}</SheetDescription>
          </SheetHeader>
          <ScrollArea className='h-[calc(100dvh-5.5rem)]'>
            <div className='space-y-1 px-4 py-4'>
              <SheetSpecRow label='Тип сделки' value={DEAL_LABELS[p.dealType]} />
              <SheetSpecRow label='Тип недвижимости' value={TYPE_LABELS[p.type]} />
              <SheetSpecRow label='Комнаты' value={p.rooms != null ? p.rooms : "—"} />
              <SheetSpecRow label='Площадь' value={`${p.area} м²`} />
              <SheetSpecRow label='Этаж' value={p.floor != null ? p.floor : "—"} />
              <SheetSpecRow
                label='Этажность дома'
                value={p.totalFloors != null ? p.totalFloors : "—"}
              />
              <SheetSpecRow
                label='Год постройки'
                value={p.yearBuilt != null ? p.yearBuilt : "—"}
              />
              <SheetSpecRow label='Состояние' value={p.condition ?? "—"} />
              <SheetSpecRow label='Адрес' value={p.location} />
              <SheetSpecRow label='Город' value={p.city ?? "—"} />
              <SheetSpecRow label='Регион' value={REGION_LABELS[p.region]} />
              <SheetSpecRow
                label='Координаты'
                value={
                  p.latitude != null && p.longitude != null
                    ? `${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`
                    : "—"
                }
              />
              <SheetSpecRow label='Цена' value={formatPrice(p.price, p.currency)} />
              <SheetSpecRow
                label='Цена за м²'
                value={
                  p.pricePerMeter != null
                    ? `${formatPrice(p.pricePerMeter, p.currency)} / м²`
                    : "—"
                }
              />
              <SheetSpecRow label='Статус' value={formatStatusLabel(raw.status)} />
              <SheetSpecRow label='Просмотры' value={p.views} />
              <SheetSpecRow
                label='Опубликовано'
                value={new Date(p.createdAt).toLocaleString("ru-RU")}
              />
              <SheetSpecRow
                label='Обновлено'
                value={new Date(p.updatedAt).toLocaleString("ru-RU")}
              />
            </div>
            <div className='border-t px-4 py-4'>
              <p className='mb-2 text-sm font-medium'>Удобства</p>
              {p.features.length === 0 ? (
                <p className='text-sm text-muted-foreground'>Не указаны</p>
              ) : (
                <ul className='list-inside list-disc space-y-1 text-sm'>
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className='border-t px-4 py-6'>
              <p className='mb-2 text-sm font-medium'>Описание</p>
              <p className='whitespace-pre-wrap text-sm leading-relaxed'>
                {p.description}
              </p>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
