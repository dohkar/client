"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  Layers,
  MapPin,
  Maximize2,
  MessageSquare,
  Phone,
  Share2,
  Sparkles,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ListingCard } from "@/components/features/listing-card";
import { MediaGallery } from "@/components/features/property-gallery/MediaGallery";
import { buildListingMediaItems } from "@/lib/listing-media";
import { ListingLocationMap } from "@/components/features/listing-detail/listing-location-map";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { ROUTES } from "@/constants";
import { formatListingRoomsForSpec } from "@/components/search/FilterLabels";
import { useAuthStore, useFavoritesStore } from "@/stores";
import { useFavorites } from "@/hooks/use-favorites";
import { useCreateListingChat } from "@/hooks/use-chats";
import { useRelatedListings } from "@/hooks/use-listings";
import { analyticsService } from "@/services/analytics.service";
import type { Listing } from "@/types/listing";
import type { PropertyDealType } from "@/types/property";
import type { LucideIcon } from "lucide-react";
import {
  formatListingLocationLine,
  getRegionLabel,
  stripPostalCodePrefix,
} from "@/lib/ui/location";

const RELATED_SWIPE_HINT_KEY = "dohkar.related.swipeHintSeen.v1";
function readSwipeHintSeen(): boolean {
  try {
    return localStorage.getItem(RELATED_SWIPE_HINT_KEY) === "1";
  } catch {
    return true;
  }
}
function writeSwipeHintSeen(): void {
  try {
    localStorage.setItem(RELATED_SWIPE_HINT_KEY, "1");
  } catch {
    // ignore
  }
}

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

function SwipeHint({ hidden, onHide }: { hidden: boolean; onHide: () => void }) {
  const [visible, setVisible] = useState(() => !readSwipeHintSeen());

  useEffect(() => {
    if (!visible) return;
    if (hidden) {
      writeSwipeHintSeen();
      setVisible(false);
      onHide();
      return;
    }
    const t = setTimeout(() => {
      writeSwipeHintSeen();
      setVisible(false);
      onHide();
    }, 4200);
    return () => clearTimeout(t);
  }, [hidden, onHide, visible]);

  if (!visible) return null;

  return (
    <div className='pointer-events-none absolute right-3 top-0 z-20 sm:hidden'>
      <div className='mt-1 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur'>
        <span>Свайпайте →</span>
      </div>
    </div>
  );
}

function SpecCell({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className='min-w-0 space-y-2 rounded-xl border border-border/70 bg-gradient-to-br from-muted/35 via-background to-background px-3 py-3 shadow-sm sm:px-4 sm:py-3.5'>
      <div className='flex items-center gap-2'>
        {Icon ? <Icon className='size-4 shrink-0 text-primary' aria-hidden /> : null}
        <p className='text-xs font-medium text-muted-foreground'>{label}</p>
      </div>
      <p className='text-sm font-semibold tracking-tight text-foreground'>{value}</p>
    </div>
  );
}

function buildAddressLine(listing: Listing): string {
  return formatListingLocationLine({
    location: listing.location ? stripPostalCodePrefix(String(listing.location)) : null,
    street: listing.street,
    house: listing.house,
    city: listing.city,
    region: listing.region ? getRegionLabel(listing.region) : null,
  });
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "" || value === "—") return null;
  return (
    <div className='flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4'>
      <dt className='shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
        {label}
      </dt>
      <dd className='min-w-0 text-sm font-medium text-foreground sm:text-right'>
        {value}
      </dd>
    </div>
  );
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
            <p className='text-xs text-muted-foreground'>на Дохкар с {sellerYear}</p>
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
        Безопасная сделка через Дохкар
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

  const [descExpanded, setDescExpanded] = useState(false);
  const [needsDescriptionExpand, setNeedsDescriptionExpand] = useState(false);
  const descMeasureRef = useRef<HTMLDivElement | null>(null);

  const mediaItems = useMemo(() => buildListingMediaItems(listing), [listing]);

  const mapLatitude = listing.latitude ?? re?.latitude ?? null;
  const mapLongitude = listing.longitude ?? re?.longitude ?? null;

  const { data: related = [] } = useRelatedListings(listingId, 8);

  const relatedFiltered = useMemo(
    () => related.filter((x) => x.id !== listingId),
    [related, listingId]
  );

  const [relatedHintHidden, setRelatedHintHidden] = useState(false);
  const [relatedCanPrev, setRelatedCanPrev] = useState(false);
  const [relatedCanNext, setRelatedCanNext] = useState(true);
  const [relatedSwiper, setRelatedSwiper] = useState<any>(null);

  const markSwipeHintSeen = useCallback(() => {
    if (readSwipeHintSeen()) return;
    writeSwipeHintSeen();
    setRelatedHintHidden(true);
  }, []);

  const updateRelatedEdges = useCallback((swiper: any) => {
    if (!swiper) return;
    setRelatedCanPrev(!swiper.isBeginning);
    setRelatedCanNext(!swiper.isEnd);
  }, []);

  const getJumpStep = useCallback((swiper: any) => {
    const spv = swiper?.params?.slidesPerView;
    if (typeof spv === "number") {
      // 1.15 -> 1, 2.1 -> 2, 2.6 -> 2, 4 -> 3 (чтобы прыгало “2–3 объявления”)
      return Math.min(3, Math.max(1, Math.floor(spv)));
    }
    return 2;
  }, []);

  const jumpPrev = useCallback(() => {
    if (!relatedSwiper) return;
    const step = getJumpStep(relatedSwiper);
    relatedSwiper.slideTo(Math.max(0, relatedSwiper.activeIndex - step));
  }, [getJumpStep, relatedSwiper]);

  const jumpNext = useCallback(() => {
    if (!relatedSwiper) return;
    const step = getJumpStep(relatedSwiper);
    relatedSwiper.slideTo(
      Math.min(relatedSwiper.slides.length - 1, relatedSwiper.activeIndex + step)
    );
  }, [getJumpStep, relatedSwiper]);

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

  const copyLink = useCallback(() => {
    if (typeof window === "undefined") return;
    const path = `/listing/${listing.slug ? `${listingId}-${listing.slug}` : listingId}`;
    const url = `${window.location.origin}${path}`;
    void navigator.clipboard.writeText(url).then(
      () => toast.success("Ссылка скопирована"),
      () => toast.error("Не удалось скопировать")
    );
  }, [listing.slug, listingId]);

  if (!re) {
    return null;
  }

  const pricePerMeter = re.area > 0 ? Math.round(listing.price / re.area) : null;

  const sellerYear = listing.sellerCreatedAt
    ? new Date(listing.sellerCreatedAt).getFullYear()
    : null;

  useLayoutEffect(() => {
    const el = descMeasureRef.current;
    if (!el) return;

    const compute = () => {
      // Если контент реально переполняет line-clamp — показываем "Читать далее".
      // С небольшим запасом из-за дробных значений line-height.
      const overflows = el.scrollHeight > el.clientHeight + 2;
      setNeedsDescriptionExpand(overflows);
    };

    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(el);
    return () => ro.disconnect();
  }, [listing.description]);

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

  return (
    <div className='mx-auto w-full max-w-7xl px-4 py-6'>
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
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className={`min-h-11 min-w-11 ${
              isFavorite ? "text-destructive hover:text-destructive" : ""
            }`}
            onClick={handleFavorite}
            disabled={isFavoritePending}
            aria-label={isFavorite ? "Убрать из избранного" : "В избранное"}
          >
            <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px] lg:items-start'>
        {/* Колонка 1 */}
        <div className='order-1 min-w-0 lg:order-none'>
          <div className='relative min-w-0 max-lg:max-h-[min(70vw,420px)] overflow-hidden rounded-xl lg:max-h-[min(560px,calc(100dvh-10rem))]'>
            <MediaGallery
              resetKey={listingId}
              media={mediaItems}
              aspectRatio='4/3'
              className='[&_[role=region]]:rounded-xl'
            />
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
            <span className='min-w-0 break-words text-sm'>
              {buildAddressLine(listing)}
            </span>
          </div>

          <div className='grid grid-cols-2 gap-3 sm:gap-4'>
            <SpecCell label='Тип' value={typeLabel} icon={Building2} />
            <SpecCell
              label='Комнаты'
              value={re.rooms != null ? formatListingRoomsForSpec(re.rooms) : "—"}
              icon={Home}
            />
            <SpecCell label='Площадь' value={`${re.area} м²`} icon={Maximize2} />
            <SpecCell
              label='Этаж'
              value={listing.floor != null ? String(listing.floor) : "—"}
              icon={Layers}
            />
          </div>

          <div className='relative'>
            {/* Измеряем переполнение отдельно (всегда clamp-3), чтобы кнопка не пропадала при раскрытии. */}
            <div
              ref={descMeasureRef}
              aria-hidden
              className='invisible pointer-events-none absolute left-0 right-0 top-0 line-clamp-3 whitespace-pre-wrap break-words text-sm text-foreground'
            >
              {listing.description}
            </div>

            <div
              className={
                !needsDescriptionExpand || descExpanded
                  ? "whitespace-pre-wrap break-words text-sm text-foreground"
                  : "line-clamp-3 whitespace-pre-wrap break-words text-sm text-foreground"
              }
            >
              {listing.description}
            </div>
            {needsDescriptionExpand && listing.description.trim().length > 0 && (
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

      <section className='mt-10 scroll-mt-4' aria-labelledby='listing-details-heading'>
        <div className='overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm'>
          <div className='border-b border-border/60 bg-gradient-to-r from-muted/40 via-muted/25 to-background px-5 py-4 sm:px-6'>
            <h2
              id='listing-details-heading'
              className='flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight text-foreground'
            >
              <Sparkles className='size-5 shrink-0 text-primary' aria-hidden />
              Характеристики и удобства
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              Полный список параметров и удобств — без скрытых блоков
            </p>
          </div>
          <div className='grid gap-0 lg:grid-cols-2'>
            <div className='space-y-4 p-5 sm:p-6 lg:border-r lg:border-border/60'>
              <h3 className='flex items-center gap-2 text-sm font-semibold text-foreground'>
                <MapPin className='size-4 shrink-0 text-primary' aria-hidden />
                Адрес и параметры
              </h3>
              <dl className='space-y-3'>
                <DetailRow label='Тип сделки' value={DEAL_LABELS[listing.dealType]} />
                <DetailRow label='Тип жилья' value={typeLabel} />
                <DetailRow
                  label='Комнаты'
                  value={
                    re.rooms != null ? formatListingRoomsForSpec(re.rooms) : undefined
                  }
                />
                <DetailRow label='Площадь' value={`${re.area} м²`} />
                <DetailRow
                  label='Этаж'
                  value={listing.floor != null ? String(listing.floor) : undefined}
                />
                <DetailRow
                  label='Цена за м²'
                  value={
                    pricePerMeter != null
                      ? `${formatPrice(pricePerMeter)} / м²`
                      : undefined
                  }
                />
                <DetailRow label='Регион' value={getRegionLabel(listing.region)} />
                <DetailRow label='Город' value={listing.city} />
                <DetailRow label='Улица' value={listing.street} />
                <DetailRow label='Дом' value={listing.house} />
                <DetailRow
                  label='Ориентир'
                  value={
                    listing.location
                      ? stripPostalCodePrefix(String(listing.location))
                      : undefined
                  }
                />
                <DetailRow
                  label='Координаты'
                  value={
                    mapLatitude != null && mapLongitude != null
                      ? `${mapLatitude.toFixed(5)}, ${mapLongitude.toFixed(5)}`
                      : undefined
                  }
                />
              </dl>
            </div>
            <div className='bg-muted/20 p-5 sm:p-6 lg:bg-gradient-to-br lg:from-muted/25 lg:to-background'>
              <h3 className='flex items-center gap-2 text-sm font-semibold text-foreground'>
                <CheckCircle2 className='size-4 shrink-0 text-primary' aria-hidden />
                Удобства и оснащение
              </h3>
              {re.features.length === 0 ? (
                <p className='mt-4 text-sm text-muted-foreground'>
                  Список удобств не указан — уточните у продавца.
                </p>
              ) : (
                <ul
                  className='mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3'
                  role='list'
                >
                  {re.features.map((feature, index) => (
                    <li
                      key={`${index}-${feature}`}
                      className='flex items-start gap-2.5 rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm shadow-sm'
                    >
                      <CheckCircle2
                        className='mt-0.5 size-4 shrink-0 text-primary'
                        aria-hidden
                      />
                      <span className='leading-snug text-foreground'>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <ListingLocationMap
        className='mt-10'
        latitude={mapLatitude}
        longitude={mapLongitude}
      />

      {relatedFiltered.length > 0 && (
        <section className='mt-12 border-t border-border pt-10'>
          <div className='flex items-center justify-between gap-3 mb-4'>
            <h2 className='text-xl font-semibold'>Похожие объявления</h2>
            <div className='flex items-center gap-2'>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='h-9 w-9 rounded-full'
                onClick={jumpPrev}
                disabled={!relatedCanPrev}
                aria-label='Похожие объявления: назад'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='h-9 w-9 rounded-full'
                onClick={jumpNext}
                disabled={!relatedCanNext}
                aria-label='Похожие объявления: вперёд'
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <div className='relative -mx-4 px-4 sm:mx-0 sm:px-0'>
            {/* Градиенты только там, где есть продолжение */}
            {relatedCanPrev && (
              <div className='pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent z-10' />
            )}
            {relatedCanNext && (
              <div className='pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent z-10' />
            )}

            <SwipeHint hidden={relatedHintHidden} onHide={() => {}} />

            <Swiper
              modules={[FreeMode, Keyboard]}
              freeMode={{ enabled: true, momentum: true, momentumBounce: false }}
              keyboard={{ enabled: true, onlyInViewport: true }}
              spaceBetween={12}
              slidesPerView={1.15}
              breakpoints={{
                420: { slidesPerView: 1.35, spaceBetween: 12 },
                640: { slidesPerView: 2.1, spaceBetween: 14 },
                768: { slidesPerView: 2.6, spaceBetween: 16 },
                1024: { slidesPerView: 4, spaceBetween: 16 },
              }}
              className='pb-2'
              onSliderFirstMove={markSwipeHintSeen}
              onTouchStart={markSwipeHintSeen}
              onSwiper={(swiper) => {
                setRelatedSwiper(swiper);
                updateRelatedEdges(swiper);
              }}
              onSlideChange={(swiper) => updateRelatedEdges(swiper)}
              onResize={(swiper) => updateRelatedEdges(swiper)}
            >
              {relatedFiltered.map((item) => (
                <SwiperSlide key={item.id} className='!h-auto'>
                  <ListingCard listing={item} variant='compact' />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}
    </div>
  );
}
