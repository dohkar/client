"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Heart, MapPin, MessageSquare, Phone, Share2 } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";

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
import { ListingCard } from "@/components/features/listing-card";
import { MediaGallery } from "@/components/features/property-gallery/MediaGallery";
import type { MediaItem } from "@/components/features/property-gallery/types";
import { ListingLocationMap } from "@/components/features/listing-detail/listing-location-map";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { ROUTES } from "@/constants";
import { useAuthStore, useFavoritesStore } from "@/stores";
import { useFavorites } from "@/hooks/use-favorites";
import { useCreateListingChat } from "@/hooks/use-chats";
import { useRelatedListings } from "@/hooks/use-listings";
import { analyticsService } from "@/services/analytics.service";
import type { Listing } from "@/types/listing";
import type { PropertyDealType } from "@/types/property";

const DEAL_LABELS: Record<PropertyDealType, string> = {
  SALE: "Продам",
  BUY: "Куплю",
  RENT_OUT: "Сдам",
  RENT_IN: "Сниму",
  EXCHANGE: "Обмен",
};

const RE_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Квартира",
  HOUSE: "Дом",
  LAND: "Участок",
  COMMERCIAL: "Коммерция",
};

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
      <span className='shrink-0 text-muted-foreground'>{label}</span>
      <span className='text-right font-medium'>{value}</span>
    </div>
  );
}

function buildAddressLine(listing: Listing): string {
  const parts = [
    listing.location,
    listing.street,
    listing.house,
    listing.city,
    listing.region,
  ].filter((p): p is string => Boolean(p && String(p).trim()));
  return parts.length > 0 ? parts.join(" · ") : "Адрес не указан";
}

/** Фото и видео для полноэкранной галереи (как на странице property). */
function buildListingMediaItems(listing: Listing): MediaItem[] {
  const items: MediaItem[] = [];
  const seen = new Set<string>();
  const imageSources =
    listing.images?.length > 0 ? listing.images : listing.image ? [listing.image] : [];

  imageSources.forEach((src, i) => {
    const url = src?.trim();
    if (!url || seen.has(url)) return;
    seen.add(url);
    items.push({
      id: `img-${i}-${url.slice(-24)}`,
      type: "image",
      src: url,
      alt: `${listing.title} — фото ${items.length + 1}`,
    });
  });

  listing.videos?.forEach((src, i) => {
    const url = src?.trim();
    if (!url || seen.has(url)) return;
    seen.add(url);
    items.push({
      id: `vid-${i}-${url.slice(-24)}`,
      type: "video",
      src: url,
    });
  });

  if (items.length === 0) {
    items.push({
      id: "placeholder",
      type: "image",
      src: "/placeholder.svg",
      alt: listing.title,
    });
  }

  return items;
}

function StickyListingCard({
  listing,
  re,
  pricePerMeter,
  sellerYear,
  onCall,
  onWrite,
  isChatPending,
}: {
  listing: Listing;
  re: NonNullable<Listing["realEstate"]>;
  pricePerMeter: number | null;
  sellerYear: number | null;
  onCall: () => void;
  onWrite: () => void;
  isChatPending: boolean;
}) {
  const initials = listing.contact.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className='rounded-xl border border-border bg-card p-5 shadow-sm'>
      <p className='text-3xl font-bold text-primary'>{formatPrice(listing.price)}</p>
      {pricePerMeter != null && re.area > 0 && (
        <p className='mt-1 text-sm text-muted-foreground'>
          {formatPrice(pricePerMeter)} / м²
        </p>
      )}
      <Separator className='my-4' />
      <div className='flex min-w-0 items-center gap-3'>
        <Avatar className='h-12 w-12 shrink-0'>
          <AvatarImage src={undefined} />
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>
        <div className='min-w-0'>
          <p className='truncate font-medium'>{listing.contact.name}</p>
          {sellerYear != null && (
            <p className='text-xs text-muted-foreground'>на Dohkar с {sellerYear}</p>
          )}
        </div>
      </div>
      <div className='mt-4 flex flex-col gap-2'>
        <Button className='min-h-11 w-full' onClick={onCall}>
          <Phone className='mr-2 h-4 w-4' />
          Позвонить
        </Button>
        <Button
          variant='outline'
          className='min-h-11 w-full'
          onClick={onWrite}
          disabled={isChatPending || !listing.allowChat}
        >
          <MessageSquare className='mr-2 h-4 w-4' />
          Написать
        </Button>
      </div>
      <p className='mt-3 text-center text-xs text-muted-foreground'>
        Безопасная сделка через Dohkar
      </p>
    </div>
  );
}

export function RealEstateListingDetail({ listing }: { listing: Listing }) {
  const router = useRouter();
  const listingId = listing.id;

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isFavorite: isLocalFavorite, toggleFavorite: toggleLocalFavorite } =
    useFavoritesStore();
  const {
    isFavorite: isFavoriteFromQuery,
    isMutating: isFavoriteMutating,
    toggleFavorite: toggleAuthFavorite,
  } = useFavorites();
  const createChatMutation = useCreateListingChat();

  const re = listing.realEstate;
  if (!re) {
    return null;
  }

  const [descExpanded, setDescExpanded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const mediaItems = useMemo(() => buildListingMediaItems(listing), [listing]);

  const mapLatitude = listing.latitude ?? re.latitude ?? null;
  const mapLongitude = listing.longitude ?? re.longitude ?? null;

  const { data: related = [] } = useRelatedListings(listingId, 8);

  const relatedFiltered = useMemo(
    () => related.filter((x) => x.id !== listingId),
    [related, listingId]
  );

  const { data: sellerStats } = useQuery({
    queryKey: ["analytics", "sellerStats", listing.userId],
    queryFn: () => analyticsService.getSellerStats(listing.userId),
    enabled: !!listing.userId,
    staleTime: 5 * 60 * 1000,
  });

  const isFavorite = useMemo(() => {
    return isAuthenticated ? isFavoriteFromQuery(listingId) : isLocalFavorite(listingId);
  }, [isAuthenticated, isFavoriteFromQuery, isLocalFavorite, listingId]);

  const isFavoritePending =
    !!listingId && isAuthenticated && isFavoriteMutating(listingId);

  const pricePerMeter = re.area > 0 ? Math.round(listing.price / re.area) : null;

  const sellerYear = listing.sellerCreatedAt
    ? new Date(listing.sellerCreatedAt).getFullYear()
    : null;

  const featurePreview = re.features.slice(0, 3);
  const featureRest = Math.max(0, re.features.length - 3);
  const descriptionLines = listing.description.split("\n");
  const needsDescriptionExpand =
    listing.description.length > 160 || descriptionLines.length > 3;

  const typeLabel = RE_TYPE_LABELS[re.type] ?? re.type;

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toggleLocalFavorite(listingId);
      return;
    }
    if (isFavoritePending) return;
    toggleAuthFavorite(listingId, listing);
  };

  const handleCall = () => {
    const tel = listing.contact.phone?.replace(/\s/g, "");
    if (tel && tel !== "Не указано" && listing.allowPhone) {
      analyticsService.recordContact(listingId, "PHONE_CLICK");
      window.location.href = `tel:${tel}`;
    } else {
      toast.error("Телефон не указан");
    }
  };

  const handleWrite = async () => {
    if (!isAuthenticated) {
      router.push(ROUTES.login);
      return;
    }
    try {
      const chat = await createChatMutation.mutateAsync(listingId);
      if (chat?.id) {
        analyticsService.recordContact(listingId, "CHAT_OPEN");
        router.push(`${ROUTES.messages}?chatId=${chat.id}`);
      }
    } catch {
      /* toast в хуке */
    }
  };

  const copyLink = useCallback(() => {
    if (typeof window === "undefined") return;
    const path = `/listing/${listing.slug ? `${listingId}-${listing.slug}` : listingId}`;
    const url = `${window.location.origin}${path}`;
    void navigator.clipboard.writeText(url).then(
      () => toast.success("Ссылка скопирована"),
      () => toast.error("Не удалось скопировать")
    );
  }, [listing.slug, listingId]);

  return (
    <div className='mx-auto w-full max-w-7xl px-4 py-6'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
        <Button variant='ghost' size='sm' onClick={() => router.back()} className='-ml-2'>
          <ArrowLeft className='mr-1.5 h-4 w-4' />
          Назад
        </Button>
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

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px] lg:items-start'>
        {/* Колонка 1 */}
        <div className='order-1 min-w-0 lg:order-none'>
          <div className='relative min-w-0 max-lg:max-h-[min(70vw,420px)] overflow-hidden rounded-xl lg:max-h-[min(560px,calc(100dvh-10rem))]'>
            <MediaGallery
              media={mediaItems}
              aspectRatio='4/3'
              className='[&_[role=region]]:rounded-xl'
            />
            <Button
              type='button'
              size='icon'
              variant='secondary'
              className={`pointer-events-auto absolute top-3 right-3 z-30 min-h-11 min-w-11 rounded-full shadow-md backdrop-blur-sm ${
                isFavorite
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : "bg-background/90"
              }`}
              onClick={handleFavorite}
              disabled={isFavoritePending}
              aria-label={isFavorite ? "Убрать из избранного" : "В избранное"}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Мобильная цена + CTA */}
        <div className='order-2 lg:hidden'>
          <StickyListingCard
            listing={listing}
            re={re}
            pricePerMeter={pricePerMeter}
            sellerYear={sellerYear}
            onCall={handleCall}
            onWrite={handleWrite}
            isChatPending={createChatMutation.isPending}
          />
        </div>

        {/* Колонка 2 */}
        <div className='order-3 flex min-w-0 flex-col gap-4 lg:order-none'>
          <div className='flex flex-wrap gap-2'>
            <Badge variant='secondary'>{DEAL_LABELS[listing.dealType]}</Badge>
            <Badge variant='outline'>{typeLabel}</Badge>
          </div>
          <h1 className='text-2xl font-bold tracking-tight text-foreground'>
            {listing.title}
          </h1>
          <div className='flex items-start gap-2 text-muted-foreground'>
            <MapPin className='mt-0.5 h-4 w-4 shrink-0' />
            <span className='text-sm'>{buildAddressLine(listing)}</span>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <SpecCell label='Тип' value={typeLabel} />
            <SpecCell label='Комнаты' value={re.rooms != null ? String(re.rooms) : "—"} />
            <SpecCell label='Площадь' value={`${re.area} м²`} />
            <SpecCell
              label='Этаж'
              value={listing.floor != null ? String(listing.floor) : "—"}
            />
          </div>

          {re.features.length > 0 && (
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
              {listing.description}
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
            Опубликовано {formatDate(listing.createdAt, "ru-RU")} · {listing.views}{" "}
            просмотров
          </p>

          <div className='rounded-xl border border-border p-4 lg:hidden'>
            <p className='mb-2 text-xs font-medium uppercase text-muted-foreground'>
              Продавец
            </p>
            <div className='flex items-center gap-3'>
              <Avatar className='h-11 w-11'>
                <AvatarFallback>
                  {listing.contact.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className='font-medium'>{listing.contact.name}</p>
                {sellerYear != null && (
                  <p className='text-xs text-muted-foreground'>
                    на Dohkar с {sellerYear}
                  </p>
                )}
                {sellerStats && (
                  <p className='text-xs text-muted-foreground'>
                    {sellerStats.totalListingsSold > 0 &&
                      `${sellerStats.totalListingsSold} продаж · `}
                    {sellerStats.totalContactAttempts > 0 &&
                      `${sellerStats.totalContactAttempts} обращений`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Колонка 3 */}
        <div className='order-4 hidden min-w-0 lg:order-none lg:block'>
          <div className='sticky top-6'>
            <StickyListingCard
              listing={listing}
              re={re}
              pricePerMeter={pricePerMeter}
              sellerYear={sellerYear}
              onCall={handleCall}
              onWrite={handleWrite}
              isChatPending={createChatMutation.isPending}
            />
          </div>
        </div>
      </div>

      <ListingLocationMap
        className='mt-10'
        latitude={mapLatitude}
        longitude={mapLongitude}
      />

      {relatedFiltered.length > 0 && (
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
            {relatedFiltered.map((item) => (
              <SwiperSlide key={item.id} className='!h-auto'>
                <ListingCard listing={item} />
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side='right' className='flex w-full flex-col p-0 sm:max-w-[480px]'>
          <SheetHeader className='shrink-0 border-b px-4 py-4 pr-12'>
            <SheetTitle>Все характеристики</SheetTitle>
            <SheetDescription>{listing.title}</SheetDescription>
          </SheetHeader>
          <ScrollArea className='h-[calc(100dvh-5.5rem)]'>
            <div className='space-y-1 px-4 py-4'>
              <SheetSpecRow label='Тип сделки' value={DEAL_LABELS[listing.dealType]} />
              <SheetSpecRow label='Тип недвижимости' value={typeLabel} />
              <SheetSpecRow label='Комнаты' value={re.rooms != null ? re.rooms : "—"} />
              <SheetSpecRow label='Площадь' value={`${re.area} м²`} />
              <SheetSpecRow
                label='Этаж'
                value={listing.floor != null ? listing.floor : "—"}
              />
              <SheetSpecRow
                label='Широта / долгота'
                value={
                  mapLatitude != null && mapLongitude != null
                    ? `${mapLatitude.toFixed(5)}, ${mapLongitude.toFixed(5)}`
                    : "—"
                }
              />
              <SheetSpecRow label='Регион' value={listing.region ?? "—"} />
              <SheetSpecRow label='Город' value={listing.city ?? "—"} />
              <SheetSpecRow label='Улица' value={listing.street ?? "—"} />
              <SheetSpecRow label='Дом' value={listing.house ?? "—"} />
              <SheetSpecRow label='Адрес (строка)' value={listing.location ?? "—"} />
              <SheetSpecRow label='Цена' value={formatPrice(listing.price)} />
              <SheetSpecRow
                label='Цена за м²'
                value={pricePerMeter != null ? `${formatPrice(pricePerMeter)} / м²` : "—"}
              />
              <SheetSpecRow label='Статус' value={listing.status} />
              <SheetSpecRow label='Модерация' value={listing.moderationStatus} />
              <SheetSpecRow label='Просмотры' value={listing.views} />
              <SheetSpecRow
                label='Опубликовано'
                value={new Date(listing.createdAt).toLocaleString("ru-RU")}
              />
              <SheetSpecRow
                label='Обновлено'
                value={new Date(listing.updatedAt).toLocaleString("ru-RU")}
              />
            </div>
            <div className='border-t px-4 py-4'>
              <p className='mb-2 text-sm font-medium'>Удобства</p>
              {re.features.length === 0 ? (
                <p className='text-sm text-muted-foreground'>Не указаны</p>
              ) : (
                <ul className='list-inside list-disc space-y-1 text-sm'>
                  {re.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className='border-t px-4 py-6'>
              <p className='mb-2 text-sm font-medium'>Описание</p>
              <p className='whitespace-pre-wrap text-sm leading-relaxed'>
                {listing.description}
              </p>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
