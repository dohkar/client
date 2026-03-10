"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Calendar,
  Eye,
  Share2,
  Heart,
  ArrowLeft,
  Phone,
  MessageSquare,
  Car,
  Smartphone,
  Building2,
} from "lucide-react";
import { useAuthStore, useFavoritesStore } from "@/stores";
import { ROUTES } from "@/constants";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { listingsService } from "@/services/listings.service";
import { favoritesService } from "@/services/favorites.service";
import { analyticsService } from "@/services/analytics.service";
import { queryKeys } from "@/lib/react-query/query-keys";
import { getCategoryConfig } from "@/constants/listing-categories";
import { useCreateListingChat } from "@/hooks/use-chats";
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
    <Badge variant="secondary" className="gap-1.5">
      <Icon className="h-3.5 w-3.5" />
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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <div><span className="text-muted-foreground text-sm">Тип</span><p className="font-medium">{typeLabels[re.type] ?? re.type}</p></div>
      {re.rooms != null && <div><span className="text-muted-foreground text-sm">Комнат</span><p className="font-medium">{re.rooms}</p></div>}
      <div><span className="text-muted-foreground text-sm">Площадь</span><p className="font-medium">{re.area} м²</p></div>
      {listing.floor != null && <div><span className="text-muted-foreground text-sm">Этаж</span><p className="font-medium">{listing.floor}</p></div>}
      {re.features.length > 0 && (
        <div className="col-span-full">
          <span className="text-muted-foreground text-sm">Удобства</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {re.features.map((f) => (<Badge key={f} variant="outline">{f}</Badge>))}
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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {v.brand && <div><span className="text-muted-foreground text-sm">Марка</span><p className="font-medium">{v.brand.name}</p></div>}
      <div><span className="text-muted-foreground text-sm">Модель</span><p className="font-medium">{v.model}</p></div>
      <div><span className="text-muted-foreground text-sm">Год</span><p className="font-medium">{v.year}</p></div>
      {v.mileage != null && <div><span className="text-muted-foreground text-sm">Пробег</span><p className="font-medium">{v.mileage.toLocaleString("ru-RU")} км</p></div>}
      {v.bodyType && <div><span className="text-muted-foreground text-sm">Кузов</span><p className="font-medium">{v.bodyType}</p></div>}
      {v.engine && <div><span className="text-muted-foreground text-sm">Двигатель</span><p className="font-medium">{v.engine}</p></div>}
      {v.transmission && <div><span className="text-muted-foreground text-sm">КПП</span><p className="font-medium">{v.transmission}</p></div>}
    </div>
  );
}

function ElectronicsDetailsBlock({ listing }: { listing: Listing }) {
  const e = listing.electronics;
  if (!e) return null;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {e.brand && <div><span className="text-muted-foreground text-sm">Бренд</span><p className="font-medium">{e.brand.name}</p></div>}
      <div><span className="text-muted-foreground text-sm">Тип</span><p className="font-medium">{e.productType}</p></div>
      <div><span className="text-muted-foreground text-sm">Модель</span><p className="font-medium">{e.model}</p></div>
      {e.storage && <div><span className="text-muted-foreground text-sm">Память</span><p className="font-medium">{e.storage}</p></div>}
      {e.condition && <div><span className="text-muted-foreground text-sm">Состояние</span><p className="font-medium">{e.condition}</p></div>}
    </div>
  );
}

const CATEGORY_DETAILS_COMPONENT: Record<ListingCategory, React.FC<{ listing: Listing }>> = {
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
  const createChatMutation = useCreateListingChat();

  const listingId = useMemo(
    () => extractIdFromSegment(typeof params.id === "string" ? params.id : undefined),
    [params.id]
  );

  const { data: listing, isLoading, error } = useQuery({
    queryKey: queryKeys.listings.detail(listingId ?? ""),
    queryFn: () => listingsService.getListingById(listingId!),
    enabled: !!listingId,
    staleTime: 30_000,
  });

  const [isFavorite, setIsFavorite] = useState<boolean>(() =>
    listingId ? isLocalFavorite(listingId) : false
  );
  const [isFavoritePending, setIsFavoritePending] = useState(false);
  const viewRecordedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!listingId) return;
    setIsFavorite(isLocalFavorite(listingId));
  }, [listingId, isLocalFavorite]);

  // Записать просмотр один раз на листинг при успешной загрузке (при смене listingId ref сбрасывается)
  useEffect(() => {
    if (!listingId || !listing) return;
    if (viewRecordedRef.current === listingId) return;
    viewRecordedRef.current = listingId;
    analyticsService.recordView(listingId);
  }, [listingId, listing]);

  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isLoading && (error || !listing)) {
    notFound();
  }

  // Ниже listing гарантированно определён (иначе вызван notFound())
  const listingData = listing!;
  const DetailsComponent = CATEGORY_DETAILS_COMPONENT[listingData.category];
  const categoryConfig = getCategoryConfig(listingData.category);

  const handleToggleFavorite = async () => {
    if (!listingId) return;

    // Неавторизованные — только локальное избранное
    if (!isAuthenticated) {
      toggleLocalFavorite(listingId);
      setIsFavorite((prev) => !prev);
      return;
    }

    if (isFavoritePending) return;
    setIsFavoritePending(true);
    try {
      if (isFavorite) {
        await favoritesService.removeListingFavorite(listingId);
        setIsFavorite(false);
      } else {
        await favoritesService.addListingFavorite(listingId);
        setIsFavorite(true);
      }
    } catch (err) {
      // Ошибка уже залогирована в сервисе
    } finally {
      setIsFavoritePending(false);
    }
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
    <div className="container max-w-5xl mx-auto py-6 px-4 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Назад
      </Button>

      {/* Gallery */}
      {listingData.images.length > 0 && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
          <Image
            src={listingData.images[0]}
            alt={listingData.title}
            fill
            className="object-cover"
            priority
          />
          <Button
            size="icon"
            variant="secondary"
            className={`absolute top-4 right-4 rounded-full backdrop-blur shadow-md ${
              isFavorite ? "bg-destructive text-white" : "bg-background/90"
            }`}
            aria-label={
              isFavorite ? "Удалить из избранного" : "Добавить в избранное"
            }
            onClick={handleToggleFavorite}
            disabled={isFavoritePending}
          >
            <Heart
              className={`h-5 w-5 ${
                isFavorite ? "fill-current" : ""
              } ${isFavoritePending ? "opacity-70" : ""}`}
            />
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={listingData.category} />
          {listingData.previewAttributes.map((attr) => (
            <Badge key={attr} variant="outline">{attr}</Badge>
          ))}
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{listingData.title}</h1>
        <p className="text-3xl font-bold text-primary">{formatPrice(listingData.price)}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {listingData.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {listingData.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" /> {listingData.views}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" /> {formatDate(listingData.createdAt)}
          </span>
        </div>
      </div>

      {/* Contact */}
      <div className="flex gap-3">
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
              <Phone className="mr-2 h-4 w-4" />
              {listingData.contact.phone}
            </a>
          </Button>
        )}
        {listingData.allowChat && (
          <Button
            variant="outline"
            onClick={handleWriteToOwner}
            disabled={createChatMutation.isPending}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {createChatMutation.isPending ? "Создание чата..." : "Написать"}
          </Button>
        )}
      </div>

      {/* Category-specific details */}
      <div className="rounded-lg border p-5 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <categoryConfig.icon className="h-5 w-5" />
          Характеристики
        </h2>
        <DetailsComponent listing={listingData} />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Описание</h2>
        <p className="whitespace-pre-wrap text-muted-foreground">{listingData.description}</p>
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
    listing.sellerCreatedAt &&
    new Date(listing.sellerCreatedAt).getFullYear();

  return (
    <div className="rounded-lg border p-5 space-y-2">
      <h2 className="text-lg font-semibold">Продавец</h2>
      <p className="font-medium">{listing.contact.name}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {stats && (
          <>
            {stats.totalListingsSold > 0 && (
              <span>{stats.totalListingsSold} продаж</span>
            )}
            {stats.totalContactAttempts > 0 && (
              <span>{stats.totalContactAttempts} обращений</span>
            )}
          </>
        )}
        {sellerYear && (
          <span>на Dohkar с {sellerYear}</span>
        )}
      </div>
    </div>
  );
}
