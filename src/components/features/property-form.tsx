"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { CitySearchSelect } from "@/components/features/CitySearchSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { propertyService } from "@/services/property.service";
import {
  getRegionIdByName,
  ensureRegionCacheInitialized,
} from "@/services/region.service";
import { regionsService } from "@/services/regions.service";
import { REGION_BACKEND_TO_NAME } from "@/lib/regions";
import {
  uploadService,
  validateImageFiles,
  validateVideoFiles,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGES_PER_PROPERTY,
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEO_FILE_SIZE,
  MAX_VIDEOS_PER_PROPERTY,
} from "@/services/upload.service";
import { toast } from "sonner";
import type { Property } from "@/types/property";
import {
  Upload,
  X,
  ImageIcon,
  AlertCircle,
  Home,
  MapPin,
  DollarSign,
  FileText,
  Building2,
  Ruler,
  DoorOpen,
  ChevronRight,
} from "lucide-react";
import { useAmenities } from "@/hooks/use-amenities";
import { geocodeAddress, reverseGeocode } from "@/lib/yandex-geocoder";
import { YandexMap } from "@/components/features/yandex-map";
import { REGION_LABELS } from "@/lib/search-constants";
import { logger } from "@/lib/utils/logger";

// Интерфейс для превью изображений
interface ImagePreview {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  uploadedPublicId?: string;
  isUploading: boolean;
  error?: string;
}

interface VideoPreview {
  id: string;
  file: File;
  uploadedUrl?: string;
  uploadedPublicId?: string;
  isUploading: boolean;
  error?: string;
  name: string;
}

/** Собирает строку адреса из компонентов */
function buildLocationFromComponents(c: {
  region?: string;
  city?: string;
  street?: string;
  house?: string;
}): string {
  return [c.region, c.city, c.street, c.house].filter(Boolean).join(", ");
}

// Схема валидации (title 10–200, description 50–2000; цена опциональна при BUY)
const propertySchema = z
  .object({
    title: z.string().min(10, "Минимум 10 символов").max(200, "Максимум 200 символов"),
    dealType: z.enum(["SALE", "BUY", "RENT_OUT", "RENT_IN", "EXCHANGE"]).default("SALE"),
    price: z.number().min(0).optional().nullable(),
    location: z.string().min(5, "Адрес должен быть не менее 5 символов"),
    region: z.enum(["Chechnya", "Ingushetia", "Other"]),
    cityId: z.string().uuid().optional().or(z.literal("")),
    street: z.string().optional(),
    house: z.string().optional(),
    type: z.enum(["apartment", "house", "land", "commercial"]),
    rooms: z.number().optional(),
    floor: z.number().min(0).optional().nullable(),
    area: z.number().min(1, "Площадь должна быть больше 0"),
    description: z
      .string()
      .min(50, "Минимум 50 символов")
      .max(2000, "Максимум 2000 символов"),
    features: z.array(z.string()).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
  .refine(
    (data) => {
      if (data.dealType !== "BUY") return (data.price ?? 0) > 0;
      return true;
    },
    { message: "Укажите цену", path: ["price"] }
  );

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  onSuccess?: (property: Property) => void;
  initialData?: Partial<Property>;
  isEdit?: boolean;
}

// Генерация уникального ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Утилиты для форматирования чисел
const formatNumberWithSpaces = (value: number | string): string => {
  const numStr = String(value).replace(/\s/g, "");
  if (!numStr) return "";
  const num = parseFloat(numStr);
  if (isNaN(num)) return "";
  return Math.floor(num).toLocaleString("ru-RU");
};

const parseFormattedNumber = (value: string): number => {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export function PropertyForm({
  onSuccess,
  initialData,
  isEdit = false,
}: PropertyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoPreviews, setVideoPreviews] = useState<VideoPreview[]>([]);
  const [videosError, setVideosError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [priceDisplay, setPriceDisplay] = useState<string>("");
  const [areaDisplay, setAreaDisplay] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reverseGeocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const coordsSourceRef = useRef<"geocode" | "map" | null>(null);

  // Удобства (скоро вернутся)
  const amenities = useAmenities({
    initialFeatures: initialData?.features || [],
  });

  // При редактировании инициализируем превью из существующих URL
  useEffect(() => {
    if (initialData?.images && initialData.images.length > 0) {
      const existingPreviews: ImagePreview[] = initialData.images.map((url, index) => ({
        id: `existing-${index}`,
        file: new File([], "existing"),
        previewUrl: url,
        uploadedUrl: url,
        isUploading: false,
      }));
      setImagePreviews(existingPreviews);
    }
    if (initialData?.videos && initialData.videos.length > 0) {
      const existingVideos: VideoPreview[] = initialData.videos.map((url, index) => ({
        id: `existing-video-${index}`,
        file: new File([], "existing-video"),
        uploadedUrl: url,
        isUploading: false,
        name: `Видео ${index + 1}`,
      }));
      setVideoPreviews(existingVideos);
    }
  }, [initialData?.images, initialData?.videos]);

  // Инициализируем кэш регионов при загрузке компонента
  useEffect(() => {
    ensureRegionCacheInitialized().catch((error) => {
      logger.error("Ошибка при инициализации кэша регионов", error);
    });
  }, []);

  useEffect(
    () => () => {
      if (reverseGeocodeTimeoutRef.current) {
        clearTimeout(reverseGeocodeTimeoutRef.current);
      }
    },
    []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: initialData?.title || "",
      dealType: (initialData?.dealType as "SALE" | "BUY" | "RENT_OUT" | "RENT_IN" | "EXCHANGE") || "SALE",
      price: initialData?.price ?? 0,
      location: initialData?.location || "",
      region: initialData?.region || "Other",
      cityId: initialData?.cityId ?? "",
      street: "",
      house: "",
      type: initialData?.type || "apartment",
      rooms: initialData?.rooms,
      floor: initialData?.floor ?? undefined,
      area: initialData?.area || 0,
      description: initialData?.description || "",
      features: initialData?.features || [],
      latitude: initialData?.latitude,
      longitude: initialData?.longitude,
    },
  });

  const selectedRegion = watch("region");

  // Получение регионов и городов
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

  // Инициализация отформатированных значений
  useEffect(() => {
    if (initialData?.price && initialData.price > 0) {
      setPriceDisplay(formatNumberWithSpaces(initialData.price));
    }
    if (initialData?.area && initialData.area > 0) {
      setAreaDisplay(String(initialData.area));
    }
  }, [initialData?.price, initialData?.area]);

  const cityId = watch("cityId");
  const street = watch("street");
  const house = watch("house");
  const cityName = cities.find((c) => c.id === cityId)?.name ?? "";

  // UX: Геокодирование по адресу с задержкой и защитой от map->geocode петли.
  // Зависимость от cityName (строка), а не от cities (массив), чтобы избежать бесконечного цикла
  // при default [] из useQuery (новая ссылка на массив каждый рендер).
  useEffect(() => {
    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);

    const regionRu =
      REGION_LABELS[selectedRegion] ?? (selectedRegion === "Other" ? "Россия" : "");
    const query = buildLocationFromComponents({
      region: regionRu,
      city: cityName,
      street: street?.trim(),
      house: house?.trim(),
    });

    const hasAddressSignal = Boolean(cityName || street?.trim());
    if (!hasAddressSignal || !query || query.length < 5) {
      setValue("latitude", undefined);
      setValue("longitude", undefined);
      return;
    }

    if (coordsSourceRef.current === "map") {
      return;
    }

    coordsSourceRef.current = "geocode";
    setIsGeocoding(true);
    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        const API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || "";
        const result = await geocodeAddress(
          {
            region: regionRu,
            city: cityName,
            street: street?.trim(),
            house: house?.trim(),
          },
          API_KEY
        );

        if (result) {
          if (coordsSourceRef.current === "map") {
            return;
          }
          setValue("latitude", result.latitude);
          setValue("longitude", result.longitude);
          setValue("location", result.formattedAddress);
          if (result.components.street) setValue("street", result.components.street);
          if (result.components.house) setValue("house", result.components.house);
          toast.success("Координаты определены", { duration: 1200 });
        } else {
          setValue("latitude", undefined);
          setValue("longitude", undefined);
          toast.warning("Не удалось определить координаты. Проверьте адрес.", {
            duration: 2500,
          });
        }
      } catch {
        setValue("latitude", undefined);
        setValue("longitude", undefined);
      } finally {
        setIsGeocoding(false);
      }
    }, 400);

    return () => {
      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    };
  }, [selectedRegion, cityId, cityName, street, house, setValue]);

  // Держим location актуальным из компонентов, если геокодер ещё не сработал.
  const locationValue = watch("location");
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

  // Координаты с карты
  const handleMapCoordinatesChange = useCallback(
    async (lat: number, lon: number) => {
      coordsSourceRef.current = "map";
      setValue("latitude", lat);
      setValue("longitude", lon);

      if (reverseGeocodeTimeoutRef.current) {
        clearTimeout(reverseGeocodeTimeoutRef.current);
      }

      reverseGeocodeTimeoutRef.current = setTimeout(async () => {
        try {
          const API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || "";
          const result = await reverseGeocode(lat, lon, API_KEY);
          if (result) {
            setValue("location", result.formattedAddress);
            if (result.components.street) setValue("street", result.components.street);
            if (result.components.house) setValue("house", result.components.house);
            toast.success("Адрес обновлён по картe", { duration: 1200 });
          }
        } catch {
          // Координаты уже установлены выше.
        }
      }, 400);
    },
    [setValue]
  );

  const propertyType = watch("type");
  const showRooms = propertyType === "apartment" || propertyType === "house";

  // Файлы: обработчик выбора и UX/визуал
  const handleFilesSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      if (imagePreviews.length + files.length > MAX_IMAGES_PER_PROPERTY) {
        toast.error(`Максимум ${MAX_IMAGES_PER_PROPERTY} изображений`);
        return;
      }

      const validationError = validateImageFiles(files);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const newPreviews: ImagePreview[] = files.map((file) => ({
        id: generateId(),
        file,
        previewUrl: URL.createObjectURL(file),
        isUploading: true,
      }));

      setImagePreviews((prev) => [...prev, ...newPreviews]);
      setImagesError(null);
      setIsUploading(true);

      try {
        const result = await uploadService.uploadPropertyImages(files);

        setImagePreviews((prev) =>
          prev.map((p) => {
            const fileIndex = newPreviews.findIndex((np) => np.id === p.id);
            if (fileIndex !== -1 && result.images[fileIndex]) {
              return {
                ...p,
                uploadedUrl: result.images[fileIndex].url,
                uploadedPublicId: result.images[fileIndex].publicId,
                isUploading: false,
              };
            }
            return p;
          })
        );

        toast.success(`Загружено ${files.length} изображ.`, { duration: 1400 });
      } catch (error) {
        setImagePreviews((prev) =>
          prev.map((p) => {
            const isNew = newPreviews.find((np) => np.id === p.id);
            if (isNew) {
              return {
                ...p,
                isUploading: false,
                error:
                  error instanceof Error ? error.message : "Ошибка загрузки изображения",
              };
            }
            return p;
          })
        );
        toast.error(error instanceof Error ? error.message : "Ошибка загрузки", {
          duration: 2200,
        });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [imagePreviews.length]
  );

  // Кнопка удаления картинки
  const removeImage = useCallback((id: string) => {
    setImagePreviews((prev) => {
      const toRemove = prev.find((p) => p.id === id);
      if (toRemove?.previewUrl && toRemove.file.size > 0) {
        URL.revokeObjectURL(toRemove.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleSelectClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleVideoSelectClick = useCallback(() => {
    videoInputRef.current?.click();
  }, []);

  const handleVideoFilesSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      if (videoPreviews.length + files.length > MAX_VIDEOS_PER_PROPERTY) {
        toast.error(`Максимум ${MAX_VIDEOS_PER_PROPERTY} видео`);
        return;
      }

      const validationError = validateVideoFiles(files);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const newPreviews: VideoPreview[] = files.map((file) => ({
        id: generateId(),
        file,
        isUploading: true,
        name: file.name,
      }));

      setVideoPreviews((prev) => [...prev, ...newPreviews]);
      setVideosError(null);
      setIsUploading(true);

      try {
        const result = await uploadService.uploadPropertyVideos(files);
        setVideoPreviews((prev) =>
          prev.map((p) => {
            const fileIndex = newPreviews.findIndex((np) => np.id === p.id);
            if (fileIndex !== -1 && result.videos[fileIndex]) {
              return {
                ...p,
                uploadedUrl: result.videos[fileIndex].url,
                uploadedPublicId: result.videos[fileIndex].publicId,
                isUploading: false,
              };
            }
            return p;
          })
        );
        toast.success(`Загружено ${files.length} видео`, { duration: 1400 });
      } catch (error) {
        setVideoPreviews((prev) =>
          prev.map((p) => {
            const isNew = newPreviews.find((np) => np.id === p.id);
            if (!isNew) return p;
            return {
              ...p,
              isUploading: false,
              error: error instanceof Error ? error.message : "Ошибка загрузки видео",
            };
          })
        );
        toast.error(error instanceof Error ? error.message : "Ошибка загрузки видео");
      } finally {
        setIsUploading(false);
        if (videoInputRef.current) {
          videoInputRef.current.value = "";
        }
      }
    },
    [videoPreviews.length]
  );

  const removeVideo = useCallback((id: string) => {
    setVideoPreviews((prev) => prev.filter((v) => v.id !== id));
  }, []);

  // Отправка формы
  const onSubmit = async (data: PropertyFormData) => {
    const uploadedImages = imagePreviews.filter((p) => p.uploadedUrl && !p.error);
    if (uploadedImages.length === 0) {
      setImagesError("Добавьте хотя бы одно изображение");
      return;
    }

    if (imagePreviews.some((p) => p.isUploading)) {
      toast.error("Дождитесь загрузки изображений");
      return;
    }
    if (videoPreviews.some((v) => v.isUploading)) {
      toast.error("Дождитесь загрузки видео");
      return;
    }

    setIsLoading(true);
    try {
      await ensureRegionCacheInitialized();

      let regionId = getRegionIdByName(data.region);

      if (!regionId && isEdit && initialData) {
        const propertyId = initialData.id;
        if (propertyId) {
          try {
            await propertyService.getPropertyById(propertyId);
            regionId = getRegionIdByName(data.region);
          } catch (error) {
            logger.error("Ошибка при загрузке недвижимости", error);
          }
        }
      }

      if (!regionId) {
        toast.error("Регион не найден. Попробуйте обновить страницу", {
          duration: 2000,
        });
        setIsLoading(false);
        return;
      }

      const typeMap: Record<string, "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL"> = {
        apartment: "APARTMENT",
        house: "HOUSE",
        land: "LAND",
        commercial: "COMMERCIAL",
      };

      const imageUrls = uploadedImages.map((p) => p.uploadedUrl!);
      const uploadedVideos = videoPreviews.filter((v) => v.uploadedUrl && !v.error);
      const videoUrls = uploadedVideos.map((v) => v.uploadedUrl!);
      if (
        (data.dealType === "SALE" ||
          data.dealType === "RENT_OUT" ||
          data.dealType === "EXCHANGE") &&
        imageUrls.length === 0
      ) {
        toast.error("Для типа «Продаю» / «Сдаю» / «Обмен» нужно хотя бы одно фото", {
          duration: 2000,
        });
        setIsLoading(false);
        return;
      }
      const featuresLabels = amenities.getFeaturesLabels();

      let locationForApi = data.location;
      if (!locationForApi || locationForApi.length < 5) {
        const regionRu =
          REGION_LABELS[data.region] ?? (data.region === "Other" ? "Россия" : "");
        const cityName = cities.find((c) => c.id === data.cityId)?.name ?? "";
        locationForApi = buildLocationFromComponents({
          region: regionRu,
          city: cityName,
          street: data.street?.trim(),
          house: data.house?.trim(),
        });
      }
      if (!locationForApi || locationForApi.length < 5) {
        toast.error("Укажите город, улицу и дом", { duration: 1800 });
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
        cityId: data.cityId && data.cityId.trim() ? data.cityId : undefined,
        type: typeMap[data.type] || "APARTMENT",
        rooms: data.rooms,
        floor: data.floor ?? undefined,
        area: data.area,
        description: data.description.trim(),
        images: imageUrls,
        videos: videoUrls,
        features: featuresLabels,
        street: data.street?.trim(),
        house: data.house?.trim(),
        latitude: data.latitude,
        longitude: data.longitude,
      };

      let response;
      if (isEdit && initialData?.id) {
        response = await propertyService.updateProperty(initialData.id, apiData);
        toast.success("Изменения сохранены!", { duration: 1800 });
        onSuccess?.(response);
      } else {
        response = await propertyService.createProperty(apiData);
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

  // Визуальное состояние кнопки
  const hasUploadingImages = imagePreviews.some((p) => p.isUploading);
  const hasUploadingVideos = videoPreviews.some((v) => v.isUploading);
  const isSubmitDisabled = isLoading || hasUploadingImages || hasUploadingVideos;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-8 max-w-3xl mx-auto pb-6'>
      {/* Основная информация */}
      <Card className='border-none shadow-md transition-all hover:shadow-2xl bg-white/60 dark:bg-card/80'>
        <CardHeader className='bg-gradient-to-r from-primary/5 to-primary/10 border-b rounded-t-md py-4 px-6'>
          <CardTitle className='flex items-center gap-2 text-2xl font-bold tracking-tight'>
            <Home className='w-6 h-6 text-primary' />
            Основная информация
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-8 px-6 pb-4 space-y-7'>
          {/* Заголовок */}
          <div className='space-y-2'>
            <Label
              htmlFor='title'
              className='text-base font-semibold flex items-center gap-2'
            >
              <FileText className='w-4 h-4 text-muted-foreground' />
              Заголовок объявления <span className='text-destructive'>*</span>
            </Label>
            <Textarea
              id='title'
              {...register("title")}
              placeholder='Например: 3-комнатная квартира в центре'
              rows={2}
              maxLength={200}
              className='text-base resize-none min-h-[56px] border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 transition'
            />
            <div className='flex items-center justify-between text-xs mt-1'>
              {errors.title ? (
                <span className='text-destructive flex items-center gap-1'>
                  <AlertCircle className='w-3 h-3' />
                  {errors.title.message}
                </span>
              ) : (
                <span className='text-muted-foreground'>Минимум 10 символов</span>
              )}
              <span
                className={`font-medium ${
                  (watch("title")?.length || 0) >= 180 ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {watch("title")?.length || 0} / 200
              </span>
            </div>
          </div>

          {/* Тип сделки */}
          <div className='space-y-2'>
            <Label className='text-base font-semibold flex items-center gap-2'>
              <DollarSign className='w-4 h-4 text-muted-foreground' />
              Тип сделки <span className='text-destructive'>*</span>
            </Label>
            <Select
              value={watch("dealType")}
              onValueChange={(v) =>
                setValue("dealType", v as "SALE" | "BUY" | "RENT_OUT" | "RENT_IN" | "EXCHANGE")
              }
            >
              <SelectTrigger className='h-11 text-base border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 transition'>
                <SelectValue placeholder='Выберите тип сделки' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='SALE'>Продаю</SelectItem>
                <SelectItem value='BUY'>Куплю</SelectItem>
                <SelectItem value='RENT_OUT'>Сдаю</SelectItem>
                <SelectItem value='RENT_IN'>Сниму</SelectItem>
                <SelectItem value='EXCHANGE'>Обмен</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Цена (опционально при «Куплю») */}
          <div className='space-y-2'>
            <Label
              htmlFor='price'
              className='text-base font-semibold flex items-center gap-2'
            >
              <DollarSign className='w-4 h-4 text-muted-foreground' />
              Цена {watch("dealType") !== "BUY" && <span className='text-destructive'>*</span>}
            </Label>
            <div className='relative'>
              <Input
                id='price'
                type='text'
                inputMode='numeric'
                value={priceDisplay}
                onChange={(e) => {
                  const value = e.target.value;
                  const cleaned = value.replace(/\D/g, "");
                  const num = parseFormattedNumber(cleaned);
                  const formatted = cleaned ? formatNumberWithSpaces(cleaned) : "";
                  setPriceDisplay(formatted);
                  setValue("price", num, { shouldValidate: true });
                }}
                onBlur={(e) => {
                  const num = parseFormattedNumber(e.target.value);
                  if (num > 0) setPriceDisplay(formatNumberWithSpaces(num));
                  else setPriceDisplay("");
                }}
                placeholder={watch("dealType") === "BUY" ? "По договорённости" : "5 000 000"}
                className='h-12 text-base pl-12 font-semibold border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 focus:border-primary/60 transition ring-0'
                aria-label='Цена недвижимости в рублях'
                autoComplete='off'
              />
              <span className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-lg'>
                ₽
              </span>
            </div>
            {errors.price && (
              <p className='text-xs text-destructive flex items-center gap-1 mt-1'>
                <AlertCircle className='w-3 h-3' />
                {errors.price.message}
              </p>
            )}
          </div>

          {/* Адрес */}
          <div className='space-y-2'>
            <Label className='text-base font-semibold flex items-center gap-2'>
              <MapPin className='w-4 h-4 text-muted-foreground' />
              Адрес <span className='text-destructive'>*</span>
              {isGeocoding && <Spinner className='w-4 h-4 ml-2' />}
            </Label>
            <input type='hidden' {...register("location")} />
            {watch("location") && (
              <div className='px-3 py-[7px] rounded border bg-muted/50 text-muted-foreground text-[13px] font-medium truncate'>
                <MapPin className='w-3 h-3 mr-1 inline' />
                <span>{watch("location")}</span>
              </div>
            )}
          </div>

          {/* Регион, город, улица, дом */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='space-y-2'>
              <Label
                htmlFor='region'
                className='text-base font-semibold flex items-center gap-2'
              >
                <MapPin className='w-4 h-4 text-muted-foreground' />
                Регион <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={watch("region")}
                onValueChange={(value) => {
                  coordsSourceRef.current = "geocode";
                  setValue("region", value as "Chechnya" | "Ingushetia" | "Other");
                  setValue("cityId", "");
                }}
              >
                <SelectTrigger className='h-11 text-base border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 transition'>
                  <SelectValue placeholder='Выберите регион' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Chechnya'>Чечня</SelectItem>
                  <SelectItem value='Ingushetia'>Ингушетия</SelectItem>
                  <SelectItem value='Other'>Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CitySearchSelect
              value={watch("cityId") || ""}
              onValueChange={(value) => {
                coordsSourceRef.current = "geocode";
                setValue("cityId", value);
              }}
              cities={cities}
              disabled={!regionIdForCities}
              placeholder={
                cities.length === 0 ? "Нет городов" : "Выберите город или найдите"
              }
              className='border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 transition'
            />

            <div className='space-y-2'>
              <Label htmlFor='street' className='text-base font-semibold'>
                Улица
              </Label>
              <Input
                id='street'
                {...register("street", {
                  onChange: () => {
                    coordsSourceRef.current = "geocode";
                  },
                })}
                placeholder='ул. Ленина'
                className='h-11 text-base border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 transition'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='house' className='text-base font-semibold'>
                Дом
              </Label>
              <Input
                id='house'
                {...register("house", {
                  onChange: () => {
                    coordsSourceRef.current = "geocode";
                  },
                })}
                placeholder='10'
                className='h-11 text-base border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 transition'
              />
            </div>
          </div>

          {/* Тип недвижимости */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label
                htmlFor='type'
                className='text-base font-semibold flex items-center gap-2'
              >
                <Building2 className='w-4 h-4 text-muted-foreground' />
                Тип недвижимости <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={watch("type")}
                onValueChange={(value) =>
                  setValue("type", value as "apartment" | "house" | "land" | "commercial")
                }
              >
                <SelectTrigger className='h-11 text-base border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 transition'>
                  <SelectValue placeholder='Выберите тип' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='apartment'>Квартира</SelectItem>
                  <SelectItem value='house'>Дом</SelectItem>
                  <SelectItem value='land'>Земельный участок</SelectItem>
                  <SelectItem value='commercial'>Коммерческая</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Карта */}
          {watch("latitude") != null &&
            watch("longitude") != null &&
            typeof watch("latitude") === "number" &&
            typeof watch("longitude") === "number" && (
              <div className='space-y-2'>
                <Label className='text-base font-semibold mb-1 flex gap-2 items-center'>
                  <MapPin className='w-4 h-4 text-muted-foreground' /> На карте
                </Label>
                <p className='text-xs text-muted-foreground'>
                  Перетащите маркер для точного расположения
                </p>
                <div className='rounded-lg overflow-hidden border shadow-sm'>
                  <YandexMap
                    latitude={watch("latitude")!}
                    longitude={watch("longitude")!}
                    zoom={16}
                    height={260}
                    onChangeCoordinates={handleMapCoordinatesChange}
                  />
                </div>
              </div>
            )}

          {/* Количество комнат и площадь */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {showRooms && (
              <div className='space-y-2 animate-in fade-in slide-in-from-left-2 duration-300'>
                <Label
                  htmlFor='rooms'
                  className='text-base font-semibold flex items-center gap-2'
                >
                  <DoorOpen className='w-4 h-4 text-muted-foreground' />
                  Количество комнат
                </Label>
                <Input
                  id='rooms'
                  type='number'
                  {...register("rooms", { valueAsNumber: true })}
                  placeholder='3'
                  className='h-11 text-base border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 transition'
                  min={1}
                  step={1}
                />
              </div>
            )}

            {showRooms && (
              <div className='space-y-2 animate-in fade-in slide-in-from-left-2 duration-300'>
                <Label
                  htmlFor='floor'
                  className='text-base font-semibold flex items-center gap-2'
                >
                  Этаж
                </Label>
                <Input
                  id='floor'
                  type='number'
                  {...register("floor", { valueAsNumber: true, setValueAs: (v) => (v === "" || Number.isNaN(v) ? undefined : v) })}
                  placeholder='Не указан'
                  className='h-11 text-base border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 transition'
                  min={0}
                  step={1}
                  aria-label='Этаж'
                />
              </div>
            )}

            <div className={`space-y-2 ${showRooms ? "" : "md:col-span-2"}`}>
              <Label
                htmlFor='area'
                className='text-base font-semibold flex items-center gap-2'
              >
                <Ruler className='w-4 h-4 text-muted-foreground' />
                Площадь <span className='text-destructive'>*</span>
              </Label>
              <div className='relative'>
                <Input
                  id='area'
                  type='text'
                  inputMode='decimal'
                  value={areaDisplay}
                  onChange={(e) => {
                    const value = e.target.value;
                    const cleaned = value.replace(/[^\d.,]/g, "").replace(",", ".");
                    const parts = cleaned.split(".");
                    const formatted =
                      parts.length > 2
                        ? parts[0] + "." + parts.slice(1).join("")
                        : cleaned;
                    setAreaDisplay(formatted);
                    const num = parseFloat(formatted) || 0;
                    setValue("area", num, { shouldValidate: true });
                  }}
                  onBlur={(e) => {
                    const num = parseFloat(e.target.value) || 0;
                    if (num > 0) setAreaDisplay(String(num));
                  }}
                  placeholder='75.5'
                  className='h-11 text-base pr-12 font-semibold border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 transition'
                  aria-label='Площадь недвижимости в квадратных метрах'
                />
                <span className='absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base font-medium'>
                  м²
                </span>
              </div>
              {errors.area && (
                <p className='text-xs text-destructive flex items-center gap-1 mt-1'>
                  <AlertCircle className='w-3 h-3' />
                  {errors.area.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Описание */}
      <Card className='border-none shadow-md transition-all hover:shadow-2xl bg-white/60 dark:bg-card/80'>
        <CardHeader className='bg-gradient-to-r from-primary/5 to-primary/10 border-b rounded-t-md py-4 px-6'>
          <CardTitle className='flex items-center gap-2 text-2xl font-bold tracking-tight'>
            <FileText className='w-5 h-5 text-primary' />
            Описание
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-8 px-6 pb-6'>
          <div className='space-y-3'>
            <Label htmlFor='description' className='text-base font-semibold flex gap-2'>
              Подробное описание <span className='text-destructive'>*</span>
            </Label>
            <Textarea
              id='description'
              {...register("description")}
              placeholder='Опишите подробно: расположение, состояние, инфраструктуру рядом...'
              rows={8}
              className='text-base resize-y border-muted-foreground/20 bg-muted/30 hover:bg-muted/40 transition'
              maxLength={2000}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                if (target.value.length >= 2000) {
                  toast.warning("Достигнут лимит в 2000 символов", {
                    duration: 2100,
                  });
                }
              }}
            />
            <div className='flex items-center justify-between text-xs mt-1'>
              <span className='flex items-center gap-1'>
                {errors.description ? (
                  <span className='text-destructive flex items-center gap-1'>
                    <AlertCircle className='w-3 h-3' />
                    {errors.description.message}
                  </span>
                ) : (
                  <span className='text-muted-foreground'>Минимум 50 символов</span>
                )}
              </span>
              <span
                className={`font-semibold transition-colors ${
                  (watch("description")?.length || 0) >= 7600
                    ? "text-destructive"
                    : (watch("description")?.length || 0) >= 7000
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
                }`}
              >
                {watch("description")?.length || 0} / 2000
              </span>
            </div>
            {watch("description") && watch("description").length >= 6000 && (
              <div className='w-full h-1 rounded-full bg-muted/50 overflow-hidden'>
                <div
                  className='h-1 rounded-full transition-all'
                  style={{
                    width: `${Math.min(
                      ((watch("description")?.length || 0) / 2000) * 100,
                      100
                    )}%`,
                    background:
                      (watch("description")?.length || 0) >= 7600
                        ? "rgba(239,68,68,0.8)" // Красный
                        : (watch("description")?.length || 0) >= 7000
                          ? "rgba(251,191,36,0.9)" // Желтый
                          : "rgba(59,130,246,0.8)", // Голубой
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Изображения */}
      <Card className='border-none shadow-md transition-all hover:shadow-2xl bg-white/60 dark:bg-card/80'>
        <CardHeader className='bg-gradient-to-r from-primary/5 to-primary/10 border-b rounded-t-md py-4 px-6'>
          <CardTitle className='flex items-center justify-between text-2xl font-bold tracking-tight w-full'>
            <div className='flex items-center gap-2'>
              <ImageIcon className='w-5 h-5 text-primary' />
              Фотографии
            </div>
            <span className='text-xs font-semibold text-muted-foreground bg-background px-4 py-1 rounded-full border-[1.5px] border-muted-foreground/20 shadow-sm'>
              {imagePreviews.length} / {MAX_IMAGES_PER_PROPERTY}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-8 px-6 pb-6 space-y-5'>
          {/* Dropzone / Upload Button */}
          <div
            onClick={handleSelectClick}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-200 hover:border-primary/60 hover:bg-muted/50
              ${imagePreviews.length >= MAX_IMAGES_PER_PROPERTY ? "opacity-40 pointer-events-none" : ""}
              ${imagesError ? "border-destructive bg-destructive/10" : "border-muted-foreground/20"}
              shrink-0
            `}
          >
            <div className='flex flex-col items-center gap-3'>
              {isUploading ? (
                <>
                  <Spinner className='w-14 h-14 text-primary' />
                  <p className='text-base font-semibold text-foreground'>Загрузка...</p>
                  <p className='text-xs text-muted-foreground'>
                    Подождите, идет загрузка
                  </p>
                </>
              ) : (
                <>
                  <div className='w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-1'>
                    <Upload className='w-8 h-8 text-primary' />
                  </div>
                  <p className='text-base font-semibold'>Добавьте красивые фотографии</p>
                  <p className='text-xs text-muted-foreground'>
                    JPG, PNG, WebP • до {MAX_FILE_SIZE / 1024 / 1024}MB на файл
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    (Рекомендуется не менее 3-х фото)
                  </p>
                </>
              )}
            </div>
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type='file'
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              multiple
              onChange={handleFilesSelect}
              className='hidden'
              disabled={imagePreviews.length >= MAX_IMAGES_PER_PROPERTY}
              aria-label='Загрузить изображения'
            />
          </div>

          {/* Error Message */}
          {imagesError && (
            <div className='p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2'>
              <AlertCircle className='w-5 h-5 text-destructive shrink-0' />
              <p className='text-sm text-destructive'>{imagesError}</p>
            </div>
          )}

          {/* Image Grid */}
          {imagePreviews.length > 0 && (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
              {imagePreviews.map((preview) => (
                <div
                  key={preview.id}
                  className='relative group aspect-[4/3] rounded-xl overflow-hidden border-2 border-border hover:border-primary/70 transition-all duration-200 shadow-sm bg-muted/20'
                >
                  {/* Image */}
                  <img
                    src={preview.previewUrl}
                    alt='Превью'
                    className={`
                      w-full h-full object-cover transition
                      ${preview.error ? "opacity-40 grayscale" : ""}
                      ${preview.isUploading ? "blur-sm" : ""}
                    `}
                  />

                  {/* Loading Overlay */}
                  {preview.isUploading && (
                    <div className='absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center backdrop-blur-md'>
                      <Spinner className='w-10 h-10 text-white' />
                    </div>
                  )}

                  {/* Error Overlay */}
                  {preview.error && (
                    <div className='absolute inset-0 bg-destructive/30 rounded-xl flex items-center justify-center backdrop-blur-sm'>
                      <div className='text-center p-2'>
                        <AlertCircle className='w-6 h-6 text-destructive mx-auto' />
                        <p className='text-xs text-destructive mt-1 font-bold'>
                          {preview.error}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Success Indicator */}
                  {preview.uploadedUrl && !preview.error && !preview.isUploading && (
                    <div className='absolute top-2 left-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-in fade-in duration-300'>
                      <svg
                        className='w-4 h-4 text-white'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={3}
                          d='M5 13l4 4L19 7'
                        />
                      </svg>
                    </div>
                  )}

                  {/* Remove Button */}
                  <Button
                    type='button'
                    variant='destructive'
                    size='icon'
                    className='absolute top-2 right-2 w-8 h-8 opacity-90 hover:opacity-100 group-hover:opacity-100 shadow-lg rounded-full bg-white/70 backdrop-blur'
                    onClick={() => removeImage(preview.id)}
                    disabled={preview.isUploading}
                    aria-label='Удалить изображение'
                  >
                    <X className='w-4 h-4' />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {imagePreviews.length === 0 && !isUploading && (
            <div className='flex flex-col items-center py-6 text-muted-foreground opacity-80'>
              <ImageIcon className='w-16 h-16 mb-3 text-muted-foreground/25' />
              <p className='text-base font-semibold mb-1'>Фотографии ещё не добавлены</p>
              <p className='text-xs'>
                Добавьте хотя бы одно изображение — красивые фото продают!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className='border-none shadow-md transition-all hover:shadow-2xl bg-white/60 dark:bg-card/80'>
        <CardHeader className='bg-gradient-to-r from-primary/5 to-primary/10 border-b rounded-t-md py-4 px-6'>
          <CardTitle className='flex items-center justify-between text-2xl font-bold tracking-tight w-full'>
            <div className='flex items-center gap-2'>Видео</div>
            <span className='text-xs font-semibold text-muted-foreground bg-background px-4 py-1 rounded-full border-[1.5px] border-muted-foreground/20 shadow-sm'>
              {videoPreviews.length} / {MAX_VIDEOS_PER_PROPERTY}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-8 px-6 pb-6 space-y-4'>
          <div
            onClick={handleVideoSelectClick}
            className={`
              border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
              transition-all duration-200 hover:border-primary/60 hover:bg-muted/50
              ${videoPreviews.length >= MAX_VIDEOS_PER_PROPERTY ? "opacity-40 pointer-events-none" : ""}
              ${videosError ? "border-destructive bg-destructive/10" : "border-muted-foreground/20"}
            `}
          >
            <p className='text-base font-semibold'>Добавьте видео (необязательно)</p>
            <p className='text-xs text-muted-foreground mt-1'>
              MP4, WebM • до {MAX_VIDEO_FILE_SIZE / 1024 / 1024}MB • до {MAX_VIDEOS_PER_PROPERTY} видео
            </p>
            <input
              ref={videoInputRef}
              type='file'
              accept={ALLOWED_VIDEO_TYPES.join(",")}
              multiple
              onChange={handleVideoFilesSelect}
              className='hidden'
              disabled={videoPreviews.length >= MAX_VIDEOS_PER_PROPERTY}
              aria-label='Загрузить видео'
            />
          </div>

          {videosError && (
            <div className='p-3 rounded-lg bg-destructive/10 border border-destructive/30'>
              <p className='text-sm text-destructive'>{videosError}</p>
            </div>
          )}

          {videoPreviews.length > 0 && (
            <div className='space-y-2'>
              {videoPreviews.map((video) => (
                <div
                  key={video.id}
                  className='flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/30'
                >
                  <div className='text-sm truncate'>
                    {video.uploadedUrl ? video.uploadedUrl.split("/").pop() : video.name}
                  </div>
                  <div className='flex items-center gap-2'>
                    {video.isUploading && <Spinner className='w-4 h-4' />}
                    {video.error && <span className='text-xs text-destructive'>{video.error}</span>}
                    <Button
                      type='button'
                      variant='destructive'
                      size='icon'
                      className='w-7 h-7'
                      onClick={() => removeVideo(video.id)}
                      disabled={video.isUploading}
                    >
                      <X className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Кнопка отправки */}
      <div className='flex justify-end gap-4 pt-4 border-t border-muted/30 mt-4 px-2'>
        <Button
          type='submit'
          className={`min-w-[210px] h-12 text-base font-bold rounded-lg shadow-xl hover:shadow-2xl transition-all btn-caucasus flex items-center justify-center gap-2
            ${isEdit ? "bg-gradient-to-r from-primary to-secondary shadow-cyan-300/30" : "bg-gradient-to-r from-primary to-[#eab308] shadow-yellow-300/30"}
          `}
          disabled={isSubmitDisabled}
        >
          {isLoading ? (
            <>
              <Spinner className='w-5 h-5 mr-2' />
              {isEdit ? "Сохраняем..." : "Создаём..."}
            </>
          ) : hasUploadingImages || hasUploadingVideos ? (
            <>
              <Spinner className='w-5 h-5 mr-2' />
              Загрузка медиа...
            </>
          ) : (
            <>
              {isEdit ? "Сохранить изменения" : "Создать объявление"}
              <ChevronRight className='w-5 h-5 ml-2' />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
