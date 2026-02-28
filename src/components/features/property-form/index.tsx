"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { propertyService } from "@/services/property.service";
import {
  getRegionIdByName,
  ensureRegionCacheInitialized,
} from "@/services/region.service";
import { regionsService } from "@/services/regions.service";
import { REGION_BACKEND_TO_NAME } from "@/lib/regions";
import { REGION_LABELS } from "@/lib/search-constants";
import { useAmenities } from "@/hooks/use-amenities";
import { toast } from "sonner";
import type { Property } from "@/types/property";
import { logger } from "@/lib/utils/logger";

import {
  propertySchema,
  buildLocationFromComponents,
  formatNumberWithSpaces,
} from "./schema";
import type { PropertyFormData } from "./schema";
import { usePropertyFormGeocode } from "./use-geocode";
import { usePropertyFormMedia } from "./use-media";
import { BasicSection } from "./sections/BasicSection";
import { AddressSection } from "./sections/AddressSection";
import { ParamsSection } from "./sections/ParamsSection";
import { DescriptionSection } from "./sections/DescriptionSection";
import { MediaSection } from "./sections/MediaSection";
import { SubmitButton } from "./SubmitButton";

interface PropertyFormProps {
  onSuccess?: (property: Property) => void;
  initialData?: Partial<Property>;
  isEdit?: boolean;
}

export function PropertyForm({
  onSuccess,
  initialData,
  isEdit = false,
}: PropertyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [priceDisplay, setPriceDisplay] = useState("");
  const [areaDisplay, setAreaDisplay] = useState("");

  const amenities = useAmenities({
    initialFeatures: initialData?.features ?? [],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: initialData?.title ?? "",
      dealType: (initialData?.dealType as PropertyFormData["dealType"]) ?? "SALE",
      price: initialData?.price ?? 0,
      location: initialData?.location ?? "",
      region: (initialData?.region as PropertyFormData["region"]) ?? "Other",
      cityId: initialData?.cityId ?? "",
      street: "",
      house: "",
      type: (initialData?.type as PropertyFormData["type"]) ?? "apartment",
      rooms: initialData?.rooms,
      floor: initialData?.floor ?? undefined,
      area: initialData?.area ?? 0,
      description: initialData?.description ?? "",
      features: initialData?.features ?? [],
      latitude: initialData?.latitude,
      longitude: initialData?.longitude,
    },
  });

  useEffect(() => {
    ensureRegionCacheInitialized().catch((err) => {
      logger.error("Ошибка инициализации кэша регионов", err);
    });
  }, []);

  useEffect(() => {
    if (initialData?.price && initialData.price > 0) {
      setPriceDisplay(formatNumberWithSpaces(initialData.price));
    }
    if (initialData?.area && initialData.area > 0) {
      setAreaDisplay(String(initialData.area));
    }
  }, [initialData?.price, initialData?.area]);

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
    queryKey: ["cities", regionIdForCities],
    queryFn: () => regionsService.getCities(regionIdForCities!),
    enabled: !!regionIdForCities,
    staleTime: 10 * 60 * 1000,
  });

  const cityName = cities.find((c) => c.id === cityId)?.name ?? "";

  const { isGeocoding, handleMapCoordinatesChange, coordsSourceRef } =
    usePropertyFormGeocode(setValue, {
      selectedRegion,
      cityId: cityId ?? "",
      cityName,
      street,
      house,
    });

  useEffect(() => {
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
  }, [selectedRegion, cityId, cityName, street, house, locationValue, setValue]);

  const media = usePropertyFormMedia(initialData?.images, initialData?.videos);

  const onSubmit = async (data: PropertyFormData) => {
    const uploadedImages = media.imagePreviews.filter((p) => p.uploadedUrl && !p.error);
    if (uploadedImages.length === 0) {
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
      await ensureRegionCacheInitialized();
      let regionId = getRegionIdByName(data.region);

      if (!regionId && isEdit && initialData?.id) {
        try {
          await propertyService.getPropertyById(initialData.id);
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

      const typeMap: Record<string, "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL"> = {
        apartment: "APARTMENT",
        house: "HOUSE",
        land: "LAND",
        commercial: "COMMERCIAL",
      };

      let locationForApi = data.location;
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

      const apiData = {
        title: data.title.trim(),
        dealType: data.dealType ?? "SALE",
        price: data.dealType === "BUY" ? 0 : (data.price ?? 0),
        currency: "RUB" as const,
        location: locationForApi,
        regionId,
        cityId: data.cityId?.trim() ? data.cityId : undefined,
        type: typeMap[data.type] ?? "APARTMENT",
        rooms: data.rooms,
        floor: data.floor ?? undefined,
        area: data.area,
        description: data.description.trim(),
        images: uploadedImages.map((p) => p.uploadedUrl!),
        videos: media.videoPreviews
          .filter((v) => v.uploadedUrl && !v.error)
          .map((v) => v.uploadedUrl!),
        features: amenities.getFeaturesLabels(),
        street: data.street?.trim(),
        house: data.house?.trim(),
        latitude: data.latitude,
        longitude: data.longitude,
      };

      if (isEdit && initialData?.id) {
        const response = await propertyService.updateProperty(initialData.id, apiData);
        toast.success("Изменения сохранены!", { duration: 1800 });
        onSuccess?.(response);
      } else {
        const response = await propertyService.createProperty(apiData);
        toast.success("Объявление создано!", { duration: 1800 });
        onSuccess?.(response);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка", {
        duration: 2200,
      });
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
      id='property-form'
    >
      <BasicSection
        register={register}
        setValue={setValue}
        watch={watch}
        errors={errors}
        priceDisplay={priceDisplay}
        setPriceDisplay={setPriceDisplay}
      />

      <AddressSection
        register={register}
        setValue={setValue}
        watch={watch}
        cities={cities}
        regionIdForCities={regionIdForCities}
        isGeocoding={isGeocoding}
        onMapCoordinatesChange={handleMapCoordinatesChange}
        coordsSourceRef={coordsSourceRef}
      />

      <ParamsSection
        register={register}
        setValue={setValue}
        watch={watch}
        errors={errors}
        areaDisplay={areaDisplay}
        setAreaDisplay={setAreaDisplay}
      />

      <DescriptionSection register={register} watch={watch} errors={errors} />

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
    </form>
  );
}
