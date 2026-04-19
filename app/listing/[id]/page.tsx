"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  Eye,
  Heart,
  ArrowLeft,
  Phone,
  MessageSquare,
  Share2,
} from "lucide-react";
import { useAuthStore, useFavoritesStore } from "@/stores";
import { ROUTES } from "@/constants";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { listingsService } from "@/services/listings.service";
import { analyticsService } from "@/services/analytics.service";
import { pushListingToViewHistory } from "@/lib/history/view-history-helpers";
import { queryKeys } from "@/lib/react-query/query-keys";
import { getCategoryConfig } from "@/constants/listing-categories";
import { useCreateListingChat } from "@/hooks/use-chats";
import { useFavorites } from "@/hooks/use-favorites";
import { RealEstateListingDetail } from "@/components/features/listing-detail/real-estate-listing-detail";
import { ListingPageSkeleton } from "@/components/features/listing-detail/listing-page-skeleton";
import { MediaGallery } from "@/components/features/property-gallery/MediaGallery";
import { buildListingMediaItems } from "@/lib/listing-media";
import { formatListingRoomsForSpec } from "@/components/search/FilterLabels";
import type { Listing, ListingCategory } from "@/types/listing";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractIdFromSegment(segment: string | undefined): string | undefined {
  if (!segment?.trim()) return undefined;
  const s = segment.trim();
  if (UUID_REGEX.test(s)) return s;
  if (s.length > 36 && s[36] === "-" && UUID_REGEX.test(s.slice(0, 36))) {
    return s.slice(0, 36);
  }
  return s;
}

function CategoryBadge({ category }: { category: ListingCategory }) {
  const config = getCategoryConfig(category);
  const Icon = config.icon;
  return (
    <Badge variant='secondary' className='gap-1.5'>
      <Icon className='h-3.5 w-3.5' />
      {config.name}
    </Badge>
  );
}

function RealEstateDetailsBlock({ listing }: { listing: Listing }) {
  const re = listing.realEstate;
  if (!re) return null;

  const typeLabels: Record<string, string> = {
    APARTMENT: "Квартира",
    HOUSE: "Дом",
    LAND: "Участок",
    COMMERCIAL: "Коммерция",
  };

  return (
    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
      <div>
        <span className='text-muted-foreground text-sm'>Тип</span>
        <p className='font-medium'>{typeLabels[re.type] ?? re.type}</p>
      </div>
      {re.rooms != null && (
        <div>
          <span className='text-muted-foreground text-sm'>Комнат</span>
          <p className='font-medium'>{formatListingRoomsForSpec(re.rooms)}</p>
        </div>
      )}
      <div>
        <span className='text-muted-foreground text-sm'>Площадь</span>
        <p className='font-medium'>{re.area} м²</p>
      </div>
      {listing.floor != null && (
        <div>
          <span className='text-muted-foreground text-sm'>Этаж</span>
          <p className='font-medium'>{listing.floor}</p>
        </div>
      )}
      {re.features.length > 0 && (
        <div className='col-span-full'>
          <span className='text-muted-foreground text-sm'>Удобства</span>
          <div className='flex flex-wrap gap-1.5 mt-1'>
            {re.features.map((f) => (
              <Badge key={f} variant='outline'>
                {f}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VehicleDetailsBlock({ listing }: { listing: Listing }) {
  const v = listing.vehicle;
  if (!v) return null;
  return (
    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
      {v.brand && (
        <div>
          <span className='text-muted-foreground text-sm'>Марка</span>
          <p className='font-medium'>{v.brand.name}</p>
        </div>
      )}
      <div>
        <span className='text-muted-foreground text-sm'>Модель</span>
        <p className='font-medium'>{v.model}</p>
      </div>
      <div>
        <span className='text-muted-foreground text-sm'>Год</span>
        <p className='font-medium'>{v.year}</p>
      </div>
      {v.mileage != null && (
        <div>
          <span className='text-muted-foreground text-sm'>Пробег</span>
          <p className='font-medium'>{v.mileage.toLocaleString("ru-RU")} км</p>
        </div>
      )}
      {v.bodyType && (
        <div>
          <span className='text-muted-foreground text-sm'>Кузов</span>
          <p className='font-medium'>{v.bodyType}</p>
        </div>
      )}
      {v.engine && (
        <div>
          <span className='text-muted-foreground text-sm'>Двигатель</span>
          <p className='font-medium'>{v.engine}</p>
        </div>
      )}
      {v.transmission && (
        <div>
          <span className='text-muted-foreground text-sm'>КПП</span>
          <p className='font-medium'>{v.transmission}</p>
        </div>
      )}
    </div>
  );
}

function ElectronicsDetailsBlock({ listing }: { listing: Listing }) {
  const e = listing.electronics;
  if (!e) return null;
  return (
    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
      {e.brand && (
        <div>
          <span className='text-muted-foreground text-sm'>Бренд</span>
          <p className='font-medium'>{e.brand.name}</p>
        </div>
      )}
      <div>
        <span className='text-muted-foreground text-sm'>Тип</span>
        <p className='font-medium'>{e.productType}</p>
      </div>
      <div>
        <span className='text-muted-foreground text-sm'>Модель</span>
        <p className='font-medium'>{e.model}</p>
      </div>
      {e.storage && (
        <div>
          <span className='text-muted-foreground text-sm'>Память</span>
          <p className='font-medium'>{e.storage}</p>
        </div>
      )}
      {e.condition && (
        <div>
          <span className='text-muted-foreground text-sm'>Состояние</span>
          <p className='font-medium'>{e.condition}</p>
        </div>
      )}
    </div>
  );
}

const CATEGORY_DETAILS_COMPONENT: Record<
  ListingCategory,
  React.FC<{ listing: Listing }>
> = {
  REAL_ESTATE: RealEstateDetailsBlock,
  VEHICLE: VehicleDetailsBlock,
  ELECTRONICS: ElectronicsDetailsBlock,
};

export default function ListingPage() {
  const params = useParams();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isFavorite: isLocalFavorite, toggleFavorite: toggleLocalFavorite } =
    useFavoritesStore();
  const {
    isFavorite: isFavoriteFromQuery,
    isMutating: isFavoriteMutating,
    toggleFavorite: toggleAuthFavorite,
  } = useFavorites();
  const createChatMutation = useCreateListingChat();

  const listingId = useMemo(
    () => extractIdFromSegment(typeof params.id === "string" ? params.id : undefined),
    [params.id]
  );

  const {
    data: listing,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.listings.detail(listingId ?? ""),
    queryFn: () => listingsService.getListingById(listingId!),
    enabled: !!listingId,
    staleTime: 30_000,
  });

  const viewRecordedRef = useRef<string | null>(null);

  const isFavorite = useMemo(() => {
    if (!listingId) return false;
    return isAuthenticated ? isFavoriteFromQuery(listingId) : isLocalFavorite(listingId);
  }, [listingId, isAuthenticated, isFavoriteFromQuery, isLocalFavorite]);

  const isFavoritePending =
    !!listingId && isAuthenticated && isFavoriteMutating(listingId);

  // Один раз на карточку: счётчик на сервере + блок «Вы смотрели» (localStorage)
  useEffect(() => {
    if (!listingId || !listing) return;
    if (viewRecordedRef.current === listingId) return;
    viewRecordedRef.current = listingId;
    void analyticsService.recordView(listingId);
    pushListingToViewHistory(listing);
  }, [listingId, listing]);

  const mediaItems = useMemo(
    () => (listing ? buildListingMediaItems(listing) : []),
    [listing]
  );

  const copyListingLink = useCallback(() => {
    if (typeof window === "undefined" || !listing) return;
    const path = listing.slug
      ? `/listing/${listing.id}-${listing.slug}`
      : `/listing/${listing.id}`;
    const url = `${window.location.origin}${path}`;
    void navigator.clipboard.writeText(url).then(
      () => toast.success("Ссылка скопирована"),
      () => toast.error("Не удалось скопировать")
    );
  }, [listing]);

  if (isLoading) {
    return <ListingPageSkeleton />;
  }

  if (!isLoading && (error || !listing)) {
    notFound();
  }

  // Ниже listing гарантированно определён (иначе вызван notFound())
  const listingData = listing!;

  if (listingData.category === "REAL_ESTATE" && listingData.realEstate) {
    return <RealEstateListingDetail listing={listingData} />;
  }

  const DetailsComponent = CATEGORY_DETAILS_COMPONENT[listingData.category];
  const categoryConfig = getCategoryConfig(listingData.category);

  const handleToggleFavorite = () => {
    if (!listingId) return;

    if (!isAuthenticated) {
      toggleLocalFavorite(listingId);
      return;
    }

    if (isFavoritePending) return;
    toggleAuthFavorite(listingId, listingData);
  };

  const handleWriteToOwner = async () => {
    if (!isAuthenticated) {
      router.push(ROUTES.login);
      return;
    }
    if (!listingData) return;
    try {
      const chat = await createChatMutation.mutateAsync(listingData.id);
      if (chat?.id) {
        analyticsService.recordContact(listingData.id, "CHAT_OPEN");
        router.push(`${ROUTES.messages}?chatId=${chat.id}`);
      } else {
        toast.error("Ошибка создания чата");
      }
    } catch {
      toast.error("Ошибка создания чата");
    }
  };

  return (
    <div className='container mx-auto max-w-7xl space-y-6 px-4 py-6'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Button variant='ghost' size='sm' onClick={() => router.back()} className='-ml-1'>
          <ArrowLeft className='mr-1.5 h-4 w-4' />
          Назад
        </Button>
        <div className='flex items-center gap-1'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='min-h-11 min-w-11'
            onClick={copyListingLink}
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
            aria-label={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
            onClick={handleToggleFavorite}
            disabled={isFavoritePending}
          >
            <Heart
              className={`h-5 w-5 ${isFavorite ? "fill-current" : ""} ${
                isFavoritePending ? "opacity-70" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      {/* Галерея: полноэкран — кнопка на самом снимке (справа сверху) */}
      <div className='relative w-full max-lg:max-h-[min(70vw,420px)] overflow-hidden rounded-xl lg:max-h-[min(560px,calc(100dvh-10rem))]'>
        <MediaGallery
          media={mediaItems}
          aspectRatio='16/9'
          className='[&_[role=region]]:rounded-xl'
        />
      </div>

      {/* Header */}
      <div className='space-y-3'>
        <div className='flex items-center gap-2 flex-wrap'>
          <CategoryBadge category={listingData.category} />
          {listingData.previewAttributes.map((attr) => (
            <Badge key={attr} variant='outline'>
              {attr}
            </Badge>
          ))}
        </div>
        <h1 className='text-2xl font-bold sm:text-3xl'>{listingData.title}</h1>
        <p className='text-3xl font-bold text-primary'>
          {formatPrice(listingData.price)}
        </p>
        <div className='flex items-center gap-4 text-sm text-muted-foreground'>
          {listingData.location && (
            <span className='flex items-center gap-1'>
              <MapPin className='h-4 w-4' /> {listingData.location}
            </span>
          )}
          <span className='flex items-center gap-1'>
            <Eye className='h-4 w-4' /> {listingData.views}
          </span>
          <span className='flex items-center gap-1'>
            <Calendar className='h-4 w-4' /> {formatDate(listingData.createdAt)}
          </span>
        </div>
      </div>

      {/* Contact */}
      <div className='flex gap-3'>
        {listingData.allowPhone && listingData.contact.phone !== "Не указано" && (
          <Button asChild>
            <a
              href={`tel:${listingData.contact.phone}`}
              onClick={() => {
                if (listingId) {
                  analyticsService.recordContact(listingId, "PHONE_CLICK");
                }
              }}
            >
              <Phone className='mr-2 h-4 w-4' />
              {listingData.contact.phone}
            </a>
          </Button>
        )}
        {listingData.allowChat && (
          <Button
            variant='outline'
            onClick={handleWriteToOwner}
            disabled={createChatMutation.isPending}
          >
            <MessageSquare className='mr-2 h-4 w-4' />
            {createChatMutation.isPending ? "Создание чата..." : "Написать"}
          </Button>
        )}
      </div>

      {/* Category-specific details */}
      <div className='rounded-lg border p-5 space-y-4'>
        <h2 className='text-lg font-semibold flex items-center gap-2'>
          <categoryConfig.icon className='h-5 w-5' />
          Характеристики
        </h2>
        <DetailsComponent listing={listingData} />
      </div>

      {/* Description */}
      <div className='space-y-2'>
        <h2 className='text-lg font-semibold'>Описание</h2>
        <p className='whitespace-pre-wrap text-muted-foreground'>
          {listingData.description}
        </p>
      </div>

      {/* Seller info + soft signals */}
      <SellerBlock listing={listingData} />
    </div>
  );
}

function SellerBlock({ listing }: { listing: Listing }) {
  const { data: stats } = useQuery({
    queryKey: ["analytics", "sellerStats", listing.userId],
    queryFn: () => analyticsService.getSellerStats(listing.userId),
    enabled: !!listing.userId,
    staleTime: 5 * 60 * 1000,
  });

  const sellerYear =
    listing.sellerCreatedAt && new Date(listing.sellerCreatedAt).getFullYear();

  return (
    <div className='rounded-lg border p-5 space-y-2'>
      <h2 className='text-lg font-semibold'>Продавец</h2>
      <p className='font-medium'>{listing.contact.name}</p>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground'>
        {stats && (
          <>
            {stats.totalListingsSold > 0 && <span>{stats.totalListingsSold} продаж</span>}
            {stats.totalContactAttempts > 0 && (
              <span>{stats.totalContactAttempts} обращений</span>
            )}
          </>
        )}
        {sellerYear && <span>на Dohkar с {sellerYear}</span>}
      </div>
    </div>
  );
}
