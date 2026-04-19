"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { listingsService } from "@/services/listings.service";
import { REAL_ESTATE_ONLY_LAUNCH } from "@/constants/config";
import { LISTING_CATEGORIES } from "@/constants/listing-categories";
import type { ListingCategory } from "@/types/listing";
import type { Listing } from "@/types/listing";
import { listingSchema } from "./schema";
import type { ListingFormData } from "./schema";
import {
  EMPTY_LISTING_FORM_DEFAULTS,
  buildListingFormDefaults,
} from "./listing-form-defaults";
import { VehicleBlock } from "./blocks/VehicleBlock";
import { ElectronicsBlock } from "./blocks/ElectronicsBlock";
import { useListingFormGeocode } from "./use-listing-geocode";
import { ListingRealEstateBasicSection } from "./sections/ListingRealEstateBasicSection";
import { ListingRealEstateAddressSection } from "./sections/ListingRealEstateAddressSection";
import { ListingRealEstateParamsSection } from "./sections/ListingRealEstateParamsSection";
import { ListingDescriptionSection } from "./sections/ListingDescriptionSection";
import { usePropertyFormMedia } from "@/components/features/property-form/use-media";
import { MediaSection } from "@/components/features/property-form/sections/MediaSection";
import { SubmitButton } from "@/components/features/property-form/SubmitButton";
import {
  buildLocationFromComponents,
  formatNumberWithSpaces,
} from "@/components/features/property-form/schema";
import { useAmenities } from "@/hooks/use-amenities";
import { AmenitiesSelector } from "@/components/features/amenities";
import {
  getRegionIdByName,
  ensureRegionCacheInitialized,
} from "@/services/region.service";
import { regionsService } from "@/services/regions.service";
import { REGION_BACKEND_TO_NAME } from "@/lib/regions";
import { REGION_LABELS } from "@/lib/search-constants";
import { logger } from "@/lib/utils/logger";

const CATEGORY_FORM_BLOCKS: Record<
  ListingCategory,
  React.FC<{
    register: ReturnType<typeof useForm<ListingFormData>>["register"];
    setValue: ReturnType<typeof useForm<ListingFormData>>["setValue"];
    watch: ReturnType<typeof useForm<ListingFormData>>["watch"];
    errors: ReturnType<typeof useForm<ListingFormData>>["formState"]["errors"];
  }>
> = {
  REAL_ESTATE: function NoopRealEstate() {
    return null;
  },
  VEHICLE: VehicleBlock,
  ELECTRONICS: ElectronicsBlock,
};

const DEAL_TYPES = [
  { value: "SALE", label: "Продажа" },
  { value: "BUY", label: "Покупка" },
  { value: "RENT_OUT", label: "Сдам" },
  { value: "RENT_IN", label: "Сниму" },
  { value: "EXCHANGE", label: "Обмен" },
] as const;

interface ListingFormProps {
  onSuccess?: (listing: Listing) => void;
  listingId?: string;
  initialListing?: Listing | null;
}

export function ListingForm({ onSuccess, listingId, initialListing }: ListingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [priceDisplay, setPriceDisplay] = useState("");
  const [areaDisplay, setAreaDisplay] = useState("");
  const isEdit = Boolean(listingId);
  const queryClient = useQueryClient();

  const amenities = useAmenities({
    initialFeatures: initialListing?.realEstate?.features ?? [],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: EMPTY_LISTING_FORM_DEFAULTS,
  });

  useEffect(() => {
    if (initialListing) {
      reset(buildListingFormDefaults(initialListing));
      if (initialListing.category === "REAL_ESTATE") {
        if (initialListing.price > 0) {
          setPriceDisplay(formatNumberWithSpaces(initialListing.price));
        }
        const a = initialListing.realEstate?.area;
        if (a != null && a > 0) {
          setAreaDisplay(String(a));
        }
      } else {
        setPriceDisplay("");
        setAreaDisplay("");
      }
    }
  }, [initialListing, reset]);

  useEffect(() => {
    if (REAL_ESTATE_ONLY_LAUNCH && !isEdit) {
      setValue("category", "REAL_ESTATE");
    }
  }, [isEdit, setValue]);

  const category = watch("category");
  const CategoryBlock = CATEGORY_FORM_BLOCKS[category];

  const selectedRegion = watch("region");
  const cityId = watch("cityId");
  const street = watch("street");
  const house = watch("house");
  const locationValue = watch("location");

  const { data: regions = [] } = useQuery({
    queryKey: ["regions"],
    queryFn: () => regionsService.getRegions(),
    staleTime: 10 * 60 * 1000,
  });

  const regionIdForCities = regions.find(
    (r) =>
      REGION_BACKEND_TO_NAME[r.name as keyof typeof REGION_BACKEND_TO_NAME] ===
      selectedRegion
  )?.id;

  const { data: cities = [] } = useQuery({
    queryKey: ["cities", regionIdForCities, category],
    queryFn: () => regionsService.getCities(regionIdForCities!),
    enabled: !!regionIdForCities && category === "REAL_ESTATE",
    staleTime: 10 * 60 * 1000,
  });

  const cityName = cities.find((c) => c.id === cityId)?.name ?? "";

  const { isGeocoding, handleMapCoordinatesChange, coordsSourceRef } =
    useListingFormGeocode(setValue, {
      enabled: category === "REAL_ESTATE",
      selectedRegion,
      cityId: cityId ?? "",
      cityName,
      street,
      house,
    });

  useEffect(() => {
    ensureRegionCacheInitialized().catch((err) => {
      logger.error("Ошибка инициализации кэша регионов", err);
    });
  }, []);

  useEffect(() => {
    if (category !== "REAL_ESTATE") return;
    if (locationValue && locationValue.length >= 5) return;
    const regionRu =
      REGION_LABELS[selectedRegion] ?? (selectedRegion === "Other" ? "Россия" : "");
    const built = buildLocationFromComponents({
      region: regionRu,
      city: cityName,
      street: street?.trim(),
      house: house?.trim(),
    });
    if (built && built.length >= 5 && built !== locationValue) {
      setValue("location", built);
    }
  }, [
    category,
    selectedRegion,
    cityId,
    cityName,
    street,
    house,
    locationValue,
    setValue,
  ]);

  const media = usePropertyFormMedia(initialListing?.images, initialListing?.videos);

  const onSubmit = async (data: ListingFormData) => {
    const uploadedImages = media.imagePreviews.filter((p) => p.uploadedUrl && !p.error);
    const needsPhotos =
      data.dealType === "SALE" ||
      data.dealType === "RENT_OUT" ||
      data.dealType === "EXCHANGE";

    if (needsPhotos && uploadedImages.length === 0) {
      media.setImagesError("Добавьте хотя бы одно изображение");
      return;
    }
    if (media.imagePreviews.some((p) => p.isUploading)) {
      toast.error("Дождитесь загрузки изображений");
      return;
    }
    if (media.videoPreviews.some((v) => v.isUploading)) {
      toast.error("Дождитесь загрузки видео");
      return;
    }

    setIsLoading(true);
    try {
      const imageUrls = uploadedImages.map((p) => p.uploadedUrl!);
      const videoUrls = media.videoPreviews
        .filter((v) => v.uploadedUrl && !v.error)
        .map((v) => v.uploadedUrl!);

      if (data.category === "REAL_ESTATE") {
        await ensureRegionCacheInitialized();
        let regionId = getRegionIdByName(data.region);

        if (!regionId && isEdit && listingId) {
          try {
            await listingsService.getListingById(listingId);
            regionId = getRegionIdByName(data.region);
          } catch (err) {
            logger.error("Ошибка загрузки объявления", err);
          }
        }

        if (!regionId) {
          toast.error("Регион не найден. Обновите страницу", { duration: 2000 });
          setIsLoading(false);
          return;
        }

        let locationForApi = data.location ?? "";
        if (!locationForApi || locationForApi.length < 5) {
          const regionRu =
            REGION_LABELS[data.region] ?? (data.region === "Other" ? "Россия" : "");
          const city = cities.find((c) => c.id === data.cityId)?.name ?? "";
          locationForApi = buildLocationFromComponents({
            region: regionRu,
            city,
            street: data.street?.trim(),
            house: data.house?.trim(),
          });
        }
        if (!locationForApi || locationForApi.length < 5) {
          toast.error("Укажите город и адрес", { duration: 1800 });
          setIsLoading(false);
          return;
        }

        const re = data.realEstate;
        if (!re) {
          toast.error("Заполните характеристики недвижимости");
          setIsLoading(false);
          return;
        }

        const payload: Record<string, unknown> = {
          category: "REAL_ESTATE",
          title: data.title.trim(),
          dealType: data.dealType,
          price: data.dealType === "BUY" ? 0 : (data.price ?? 0),
          currency: "RUB",
          description: data.description.trim(),
          images: imageUrls,
          ...(videoUrls.length > 0 ? { videos: videoUrls } : {}),
          location: locationForApi,
          regionId,
          cityId: data.cityId?.trim() ? data.cityId : undefined,
          street: data.street?.trim(),
          house: data.house?.trim(),
          floor: data.floor ?? undefined,
          realEstate: {
            type: re.type,
            rooms: re.rooms,
            area: re.area,
            features: amenities.getFeaturesLabels(),
            latitude: re.latitude,
            longitude: re.longitude,
          },
        };

        const listing = listingId
          ? await listingsService.updateListing(listingId, payload)
          : await listingsService.createListing(payload);

        toast.success(listingId ? "Изменения сохранены" : "Объявление создано");
        void queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.listings.limits });
        if (listingId) {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.listings.detail(listingId),
          });
        }
        onSuccess?.(listing);
      } else {
        const payload: Record<string, unknown> = {
          category: data.category,
          title: data.title.trim(),
          dealType: data.dealType,
          price: data.dealType === "BUY" ? 0 : (data.price ?? 0),
          currency: "RUB",
          description: data.description.trim(),
          images: imageUrls,
          ...(videoUrls.length > 0 ? { videos: videoUrls } : {}),
          location: data.location?.trim() || undefined,
          street: data.street?.trim() || undefined,
          house: data.house?.trim() || undefined,
          floor: data.floor ?? undefined,
        };

        if (data.category === "VEHICLE" && data.vehicle) {
          payload.vehicle = data.vehicle;
        }
        if (data.category === "ELECTRONICS" && data.electronics) {
          payload.electronics = data.electronics;
        }

        const listing = listingId
          ? await listingsService.updateListing(listingId, payload)
          : await listingsService.createListing(payload);

        toast.success(listingId ? "Изменения сохранены" : "Объявление создано");
        void queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.listings.limits });
        if (listingId) {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.listings.detail(listingId),
          });
        }
        onSuccess?.(listing);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : listingId
            ? "Ошибка сохранения"
            : "Ошибка создания объявления"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const hasUploadingMedia =
    media.imagePreviews.some((p) => p.isUploading) ||
    media.videoPreviews.some((v) => v.isUploading);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className='max-w-4xl w-full mx-auto space-y-5 pb-24 md:pb-8'
      autoComplete='off'
      id='listing-form'
    >
      {!(REAL_ESTATE_ONLY_LAUNCH && !isEdit) && (
        <div className='space-y-2'>
          <Label className='text-base font-semibold'>Категория</Label>
          {isEdit && (
            <p className='text-sm text-muted-foreground'>
              Категорию нельзя сменить после публикации. Создайте новое объявление для
              другой категории.
            </p>
          )}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            {LISTING_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type='button'
                  disabled={isEdit}
                  onClick={() => !isEdit && setValue("category", cat.id)}
                  className={`flex items-center gap-3 rounded-lg border p-4 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/50"
                  } ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <Icon className='h-6 w-6 shrink-0' />
                  <div className='text-left'>
                    <p className='font-medium'>{cat.name}</p>
                    <p className='text-xs text-muted-foreground'>{cat.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {category === "REAL_ESTATE" ? (
        <>
          <ListingRealEstateBasicSection
            register={register}
            setValue={setValue}
            watch={watch}
            errors={errors}
            priceDisplay={priceDisplay}
            setPriceDisplay={setPriceDisplay}
          />
          <ListingRealEstateAddressSection
            register={register}
            setValue={setValue}
            watch={watch}
            cities={cities}
            regionIdForCities={regionIdForCities}
            isGeocoding={isGeocoding}
            onMapCoordinatesChange={handleMapCoordinatesChange}
            coordsSourceRef={coordsSourceRef}
            geolocationEnabled={category === "REAL_ESTATE"}
          />
          <ListingRealEstateParamsSection
            register={register}
            setValue={setValue}
            watch={watch}
            errors={errors}
            areaDisplay={areaDisplay}
            setAreaDisplay={setAreaDisplay}
          />
          <ListingDescriptionSection register={register} watch={watch} errors={errors} />
          <AmenitiesSelector
            selectedFeatures={amenities.selectedFeatures}
            customFeature={amenities.customFeature}
            setCustomFeature={amenities.setCustomFeature}
            toggleFeature={amenities.toggleFeature}
            addCustomFeature={amenities.addCustomFeature}
            removeFeature={amenities.removeFeature}
            featuresByCategory={amenities.featuresByCategory}
          />
          <MediaSection
            imagePreviews={media.imagePreviews}
            imagesError={media.imagesError}
            onImagesSelect={media.handleFilesSelect}
            onRemoveImage={media.removeImage}
            videoPreviews={media.videoPreviews}
            videosError={media.videosError}
            onVideosSelect={media.handleVideoFilesSelect}
            onRemoveVideo={media.removeVideo}
            isUploading={media.isUploading}
          />
          <SubmitButton
            isLoading={isLoading}
            isUploadingMedia={hasUploadingMedia}
            isEdit={isEdit}
          />
        </>
      ) : (
        <>
          <div className='space-y-4 rounded-lg border p-4'>
            <h3 className='font-semibold'>Основное</h3>

            <div className='space-y-2'>
              <Label>Заголовок</Label>
              <Input {...register("title")} placeholder='Заголовок объявления' />
              {errors.title && (
                <p className='text-sm text-destructive'>{errors.title.message}</p>
              )}
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Тип сделки</Label>
                <Select
                  value={watch("dealType")}
                  onValueChange={(v) =>
                    setValue("dealType", v as ListingFormData["dealType"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEAL_TYPES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Цена (руб.)</Label>
                <Input
                  type='number'
                  min='0'
                  {...register("price", { valueAsNumber: true })}
                  placeholder='5 000 000'
                />
                {errors.price && (
                  <p className='text-sm text-destructive'>{errors.price.message}</p>
                )}
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Описание</Label>
              <Textarea
                {...register("description")}
                placeholder='Подробное описание объявления (минимум 50 символов)'
                rows={5}
              />
              {errors.description && (
                <p className='text-sm text-destructive'>{errors.description.message}</p>
              )}
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Адрес (строка)</Label>
                <Input
                  {...register("location")}
                  placeholder='г. Грозный, ул. Ленина, д. 10'
                />
              </div>
              <div className='space-y-2'>
                <Label>Этаж</Label>
                <Input
                  type='number'
                  min='0'
                  {...register("floor", { valueAsNumber: true })}
                  placeholder='2'
                />
              </div>
            </div>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Улица</Label>
                <Input {...register("street")} placeholder='ул. Ленина' />
              </div>
              <div className='space-y-2'>
                <Label>Дом</Label>
                <Input {...register("house")} placeholder='10' />
              </div>
            </div>
          </div>

          <CategoryBlock
            register={register}
            setValue={setValue}
            watch={watch}
            errors={errors}
          />

          <MediaSection
            imagePreviews={media.imagePreviews}
            imagesError={media.imagesError}
            onImagesSelect={media.handleFilesSelect}
            onRemoveImage={media.removeImage}
            videoPreviews={media.videoPreviews}
            videosError={media.videosError}
            onVideosSelect={media.handleVideoFilesSelect}
            onRemoveVideo={media.removeVideo}
            isUploading={media.isUploading}
          />

          <Button
            type='submit'
            className='w-full'
            size='lg'
            disabled={isLoading || hasUploadingMedia}
          >
            {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {listingId ? "Сохранить изменения" : "Создать объявление"}
          </Button>
        </>
      )}
    </form>
  );
}
