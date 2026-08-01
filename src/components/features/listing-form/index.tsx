"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { listingsService } from "@/services/listings.service";
import type { Listing } from "@/types/listing";
import { listingRealEstateFormSchema } from "./schema";
import type { ListingFormData } from "./schema";
import {
  EMPTY_LISTING_FORM_DEFAULTS,
  buildListingFormDefaults,
} from "./listing-form-defaults";
import { useListingFormLocation } from "./use-listing-geocode";
import { ListingRealEstateBasicSection } from "./sections/ListingRealEstateBasicSection";
import { ListingAddressSuggestStep } from "./sections/ListingAddressSuggestStep";
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
import { geocodeAddress } from "@/lib/dadata-geocoder";
import { applyGeocodeResultToListingForm } from "./apply-address-from-dadata";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "basics", title: "Основное" },
  { key: "address", title: "Адрес" },
  { key: "params", title: "Параметры" },
  { key: "media", title: "Описание и фото" },
] as const;

interface ListingFormProps {
  onSuccess?: (listing: Listing) => void;
  listingId?: string;
  initialListing?: Listing | null;
}

export function ListingForm({ onSuccess, listingId, initialListing }: ListingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const isFirstStepEffect = useRef(true);
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
    trigger,
    getValues,
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingRealEstateFormSchema),
    defaultValues: EMPTY_LISTING_FORM_DEFAULTS,
  });

  useEffect(() => {
    setValue("category", "REAL_ESTATE");
  }, [setValue]);

  useEffect(() => {
    if (initialListing) {
      reset(buildListingFormDefaults(initialListing));
      if (initialListing.price > 0) {
        setPriceDisplay(formatNumberWithSpaces(initialListing.price));
      } else {
        setPriceDisplay("");
      }
      const a = initialListing.realEstate?.area;
      if (a != null && a > 0) {
        setAreaDisplay(String(a));
      } else {
        setAreaDisplay("");
      }
      setStep(0);
    }
  }, [initialListing, reset]);

  useEffect(() => {
    if (isFirstStepEffect.current) {
      isFirstStepEffect.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const selectedRegion = watch("region");

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
    queryKey: ["cities", regionIdForCities],
    queryFn: () => regionsService.getCities(regionIdForCities!),
    enabled: !!regionIdForCities,
    staleTime: 10 * 60 * 1000,
  });

  const { handleGeolocationPosition, isResolvingLocation } = useListingFormLocation(
    setValue,
    { enabled: true, regions }
  );

  useEffect(() => {
    ensureRegionCacheInitialized().catch((err) => {
      logger.error("Ошибка инициализации кэша регионов", err);
    });
  }, []);

  const media = usePropertyFormMedia(initialListing?.images, initialListing?.videos);

  const handleGoNext = useCallback(async () => {
    if (step === 0) {
      const ok = await trigger(["title", "dealType", "price"]);
      if (!ok) return;
    }
    if (step === 1) {
      const okLoc = await trigger("location");
      if (!okLoc) return;
      let lat = getValues("realEstate.latitude");
      const loc = getValues("location")?.trim() ?? "";
      if (lat == null && loc.length >= 5) {
        const r = await geocodeAddress({
          country: "Россия",
          region: "",
          city: loc,
          street: undefined,
          house: undefined,
        });
        if (r.ok) {
          await applyGeocodeResultToListingForm(r.data, setValue, regions, {
            mode: "autoCoarse",
          });
          lat = r.data.latitude;
        }
      }
      if (lat == null) {
        toast.error(
          "Выберите адрес из подсказок или нажмите «Определить по геолокации».",
          { duration: 3500 }
        );
        return;
      }
    }
    if (step === 2) {
      const ok = await trigger([
        "realEstate.type",
        "realEstate.area",
        "realEstate.rooms",
        "floor",
      ]);
      if (!ok) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, trigger, getValues, setValue, regions]);

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
        toast.error("Укажите адрес", { duration: 1800 });
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

      if (!listingId) {
        payload.category = data.category;
      }

      const listing = listingId
        ? await listingsService.updateListing(listingId, payload)
        : await listingsService.createListing(payload);

      toast.success(
        listingId ? "Изменения сохранены" : "Объявление создано и отправлено на модерацию"
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.listings.limits });
      if (listingId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.listings.detail(listingId),
        });
      }
      onSuccess?.(listing);
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
      id='listing-form'
      onSubmit={(e) => e.preventDefault()}
      className='mx-auto w-full max-w-4xl space-y-5 pb-24 md:pb-8'
      autoComplete='off'
    >
      <div className='rounded-xl border border-border bg-card/50 p-4'>
        <p className='mb-3 text-sm font-medium text-muted-foreground'>
          Шаг {step + 1} из {STEPS.length}
        </p>
        <div className='flex flex-wrap gap-2'>
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type='button'
              disabled={i > step}
              onClick={() => {
                if (i <= step) setStep(i);
              }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}. {s.title}
            </button>
          ))}
        </div>
      </div>

      {step === 0 && (
        <ListingRealEstateBasicSection
          register={register}
          setValue={setValue}
          watch={watch}
          errors={errors}
          priceDisplay={priceDisplay}
          setPriceDisplay={setPriceDisplay}
        />
      )}

      {step === 1 && (
        <ListingAddressSuggestStep
          register={register}
          setValue={setValue}
          watch={watch}
          errors={errors}
          regions={regions}
          preferredRegion={selectedRegion}
          isResolvingLocation={isResolvingLocation}
          onGeolocation={handleGeolocationPosition}
        />
      )}

      {step === 2 && (
        <ListingRealEstateParamsSection
          register={register}
          setValue={setValue}
          watch={watch}
          errors={errors}
          areaDisplay={areaDisplay}
          setAreaDisplay={setAreaDisplay}
        />
      )}

      {step === 3 && (
        <>
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
        </>
      )}

      {step < 3 ? (
        <div className='flex flex-row items-center gap-3 border-t border-border pt-4'>
          <Button
            type='button'
            variant='outline'
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className='flex-1 sm:flex-none sm:min-w-[120px]'
          >
            <ChevronLeft className='mr-1 h-4 w-4' />
            Назад
          </Button>
          <Button
            type='button'
            className='flex-1 sm:flex-none sm:min-w-[140px]'
            onClick={() => void handleGoNext()}
          >
            Далее
            <ChevronRight className='ml-1 h-4 w-4' />
          </Button>
        </div>
      ) : (
        <div className='flex flex-row items-center gap-3 border-t border-border pt-4'>
          <Button
            type='button'
            variant='outline'
            className='shrink-0'
            onClick={() => setStep(2)}
          >
            <ChevronLeft className='mr-1 h-4 w-4' />
            Назад
          </Button>
          <div className='min-w-0 flex-1'>
            <SubmitButton
              isLoading={isLoading}
              isUploadingMedia={hasUploadingMedia}
              isEdit={isEdit}
              onPressSubmit={() => void handleSubmit(onSubmit)()}
            />
          </div>
        </div>
      )}
    </form>
  );
}
