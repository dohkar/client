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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { propertyService } from "@/services/property.service";
import { getRegionIdByName, ensureRegionCacheInitialized } from "@/services/region.service";
import { regionsService } from "@/services/regions.service";
import { REGION_BACKEND_TO_NAME } from "@/lib/regions";
import {
  uploadService,
  validateImageFiles,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGES_PER_PROPERTY,
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
import { geocodeAddress } from "@/lib/yandex-geocoder";

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



// Схема валидации без images как массива URL
const propertySchema = z.object({
  title: z.string().min(10, "Заголовок должен быть не менее 10 символов"),
  price: z.number().min(1, "Цена должна быть больше 0"),
  location: z.string().min(5, "Адрес должен быть не менее 5 символов"),
  region: z.enum(["Chechnya", "Ingushetia", "Other"]),
  cityId: z.string().uuid().optional().or(z.literal("")),
  type: z.enum(["apartment", "house", "land", "commercial"]),
  rooms: z.number().optional(),
  area: z.number().min(1, "Площадь должна быть больше 0"),
  description: z
    .string()
    .min(50, "Описание должно быть не менее 50 символов")
    .max(8000, "Описание не должно превышать 8000 символов"),
  features: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

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

export function PropertyForm({ onSuccess, initialData, isEdit = false }: PropertyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [priceDisplay, setPriceDisplay] = useState<string>("");
  const [areaDisplay, setAreaDisplay] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Хук для управления удобствами
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
  }, [initialData?.images]);

  // Инициализируем кэш регионов при загрузке компонента
  useEffect(() => {
    ensureRegionCacheInitialized().catch((error) => {
      console.error("Ошибка при инициализации кэша регионов:", error);
    });
  }, []);

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
      price: initialData?.price || 0,
      location: initialData?.location || "",
      region: initialData?.region || "Other",
      cityId: initialData?.cityId ?? "",
      type: initialData?.type || "apartment",
      rooms: initialData?.rooms,
      area: initialData?.area || 0,
      description: initialData?.description || "",
      features: initialData?.features || [],
      latitude: initialData?.latitude,
      longitude: initialData?.longitude,
    },
  });

  // Регионы и города с API (после useForm, т.к. используем watch)
  const selectedRegion = watch("region");
  const { data: regions = [] } = useQuery({
    queryKey: ["regions"],
    queryFn: () => regionsService.getRegions(),
    staleTime: 10 * 60 * 1000,
  });
  const regionIdForCities = regions.find(
    (r) => REGION_BACKEND_TO_NAME[r.name as keyof typeof REGION_BACKEND_TO_NAME] === selectedRegion
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

  // Автоматическое геокодирование адреса
  const locationValue = watch("location");
  useEffect(() => {
    // Очищаем предыдущий таймаут
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    // Если адрес слишком короткий, не геокодируем
    if (!locationValue || locationValue.length < 5) {
      setValue("latitude", undefined);
      setValue("longitude", undefined);
      return;
    }

    // Если координаты уже есть и адрес не изменился, не геокодируем
    if (initialData?.latitude && initialData?.longitude && locationValue === initialData.location) {
      return;
    }

    // Debounce - ждем 1 секунду после последнего изменения
    setIsGeocoding(true);
    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        const API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || "";
        const result = await geocodeAddress(locationValue, API_KEY);
        
        if (result) {
          setValue("latitude", result.latitude);
          setValue("longitude", result.longitude);
          // Обновляем адрес на более точный, если геокодер вернул улучшенную версию
          if (result.formattedAddress !== locationValue) {
            setValue("location", result.formattedAddress);
          }
          toast.success("Координаты определены автоматически");
        } else {
          setValue("latitude", undefined);
          setValue("longitude", undefined);
          toast.warning("Не удалось определить координаты. Проверьте адрес.");
        }
      } catch (error) {
        console.error("Ошибка геокодирования:", error);
        setValue("latitude", undefined);
        setValue("longitude", undefined);
      } finally {
        setIsGeocoding(false);
      }
    }, 1000);

    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, [locationValue, setValue, initialData]);

  const propertyType = watch("type");
  const showRooms = propertyType === "apartment" || propertyType === "house";

  // Обработчик выбора файлов
  const handleFilesSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      // Проверяем общий лимит
      const totalImages = imagePreviews.length + files.length;
      if (totalImages > MAX_IMAGES_PER_PROPERTY) {
        toast.error(`Максимальное количество изображений: ${MAX_IMAGES_PER_PROPERTY}`);
        return;
      }

      // Валидация файлов
      const validationError = validateImageFiles(files);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Создаем превью для новых файлов
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
        // Загружаем файлы на сервер
        const result = await uploadService.uploadPropertyImages(files);

        // Обновляем превью с загруженными URL
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

        toast.success(`Загружено ${files.length} изображений`);
      } catch (error) {
        // Помечаем ошибку в превью
        setImagePreviews((prev) =>
          prev.map((p) => {
            const isNew = newPreviews.find((np) => np.id === p.id);
            if (isNew) {
              return {
                ...p,
                isUploading: false,
                error: error instanceof Error ? error.message : "Ошибка загрузки",
              };
            }
            return p;
          })
        );
        toast.error(error instanceof Error ? error.message : "Ошибка загрузки изображений");
      } finally {
        setIsUploading(false);
        // Очищаем input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [imagePreviews.length]
  );

  // Удаление изображения
  const removeImage = useCallback((id: string) => {
    setImagePreviews((prev) => {
      const toRemove = prev.find((p) => p.id === id);
      if (toRemove?.previewUrl && toRemove.file.size > 0) {
        // Освобождаем object URL только для локальных превью
        URL.revokeObjectURL(toRemove.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  // Открытие диалога выбора файлов
  const handleSelectClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Отправка формы
  const onSubmit = async (data: PropertyFormData) => {
    // Проверяем, что есть хотя бы одно загруженное изображение
    const uploadedImages = imagePreviews.filter((p) => p.uploadedUrl && !p.error);
    if (uploadedImages.length === 0) {
      setImagesError("Добавьте хотя бы одно изображение");
      return;
    }

    // Проверяем, что все загрузки завершены
    const pendingUploads = imagePreviews.filter((p) => p.isUploading);
    if (pendingUploads.length > 0) {
      toast.error("Дождитесь завершения загрузки всех изображений");
      return;
    }

    setIsLoading(true);
    try {
      // Убеждаемся, что кэш регионов инициализирован
      await ensureRegionCacheInitialized();
      
      // Получаем regionId по названию региона
      let regionId = getRegionIdByName(data.region);
      
      // Если regionId не найден, пытаемся получить его из initialData (при редактировании)
      if (!regionId && isEdit && initialData) {
        const propertyId = initialData.id;
        // При редактировании можно попробовать получить regionId из бэкенда
        // Для этого нужно загрузить полные данные недвижимости
        if (propertyId) {
          try {
            const fullProperty = await propertyService.getPropertyById(propertyId);
            // После загрузки кэш должен быть заполнен, пробуем снова
            regionId = getRegionIdByName(data.region);
          } catch (error) {
            console.error("Ошибка при загрузке данных недвижимости:", error);
          }
        }
      }
      
      if (!regionId) {
        toast.error("Регион не найден. Пожалуйста, обновите страницу и попробуйте снова.");
        setIsLoading(false);
        return;
      }

      const typeMap: Record<string, "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL"> = {
        apartment: "APARTMENT",
        house: "HOUSE",
        land: "LAND",
        commercial: "COMMERCIAL",
      };

      // Собираем URL загруженных изображений
      const imageUrls = uploadedImages.map((p) => p.uploadedUrl!);

      // Преобразуем features: ID -> Label для предустановленных, оставляем как есть для кастомных
      const featuresLabels = amenities.getFeaturesLabels();

      const apiData = {
        title: data.title,
        price: data.price,
        currency: "RUB" as const,
        location: data.location,
        regionId,
        cityId: data.cityId && data.cityId.trim() ? data.cityId : undefined,
        type: typeMap[data.type] || "APARTMENT",
        rooms: data.rooms,
        area: data.area,
        description: data.description,
        images: imageUrls,
        features: featuresLabels,
        latitude: data.latitude,
        longitude: data.longitude,
      };

      let response;
      if (isEdit && initialData?.id) {
        response = await propertyService.updateProperty(initialData.id, apiData);
        toast.success("Объявление успешно обновлено");
        onSuccess?.(response);
      } else {
        response = await propertyService.createProperty(apiData);
        toast.success("Объявление успешно создано");
        onSuccess?.(response);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  // Проверяем, есть ли загружающиеся изображения
  const hasUploadingImages = imagePreviews.some((p) => p.isUploading);
  const isSubmitDisabled = isLoading || hasUploadingImages;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Основная информация */}
      <Card className="border-primary/20 shadow-lg transition-all hover:shadow-xl">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Home className="w-5 h-5 text-primary" />
            Основная информация
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Заголовок */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Заголовок объявления *
            </Label>
            <Textarea
              id="title"
              {...register("title")}
              placeholder="Например: 3-комнатная квартира в центре"
              rows={2}
              className="text-base resize-none min-h-[60px]"
            />
            {errors.title && (
              <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4" />
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Цена - полная ширина с иконкой */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-base font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Цена (₽) *
            </Label>
            <div className="relative">
              <Input
                id="price"
                type="text"
                inputMode="numeric"
                value={priceDisplay}
                onChange={(e) => {
                  const value = e.target.value;
                  // Разрешаем только цифры
                  const cleaned = value.replace(/\D/g, "");
                  const num = parseFormattedNumber(cleaned);
                  // Форматируем с пробелами при вводе
                  const formatted = cleaned ? formatNumberWithSpaces(cleaned) : "";
                  setPriceDisplay(formatted);
                  setValue("price", num, { shouldValidate: true });
                }}
                onBlur={(e) => {
                  const num = parseFormattedNumber(e.target.value);
                  if (num > 0) {
                    setPriceDisplay(formatNumberWithSpaces(num));
                  } else {
                    setPriceDisplay("");
                  }
                }}
                placeholder="5 000 000"
                className="h-11 text-base pl-10 font-medium"
                aria-label="Цена недвижимости в рублях"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                ₽
              </span>
            </div>
            {errors.price && (
              <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4" />
                {errors.price.message}
              </p>
            )}
          </div>

          {/* Адрес */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-base font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Адрес *
              {isGeocoding && (
                <Spinner className="w-4 h-4 ml-2" />
              )}
            </Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="г. Грозный, ул. Ленина, д. 10"
              className="h-11 text-base"
            />
            {errors.location && (
              <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4" />
                {errors.location.message}
              </p>
            )}
            {watch("latitude") && watch("longitude") && (
              <p className="text-xs text-muted-foreground mt-1">
                Координаты: {watch("latitude")?.toFixed(6)}, {watch("longitude")?.toFixed(6)}
              </p>
            )}
          </div>

          {/* Регион, город и тип недвижимости */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region" className="text-base font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Регион *
              </Label>
              <Select
                value={watch("region")}
                onValueChange={(value) => {
                  setValue("region", value as "Chechnya" | "Ingushetia" | "Other");
                  setValue("cityId", ""); // сброс города при смене региона
                }}
              >
                <SelectTrigger className="h-11 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chechnya">Чечня</SelectItem>
                  <SelectItem value="Ingushetia">Ингушетия</SelectItem>
                  <SelectItem value="Other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityId" className="text-base font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Город
              </Label>
              <Select
                value={watch("cityId") || "none"}
                onValueChange={(value) => setValue("cityId", value === "none" ? "" : value)}
                disabled={!regionIdForCities || cities.length === 0}
              >
                <SelectTrigger className="h-11 text-base">
                  <SelectValue placeholder={cities.length === 0 ? "Нет городов" : "Выберите город"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не выбран</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-base font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Тип недвижимости *
              </Label>
              <Select
                value={watch("type")}
                onValueChange={(value) =>
                  setValue("type", value as "apartment" | "house" | "land" | "commercial")
                }
              >
                <SelectTrigger className="h-11 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Квартира</SelectItem>
                  <SelectItem value="house">Дом</SelectItem>
                  <SelectItem value="land">Земельный участок</SelectItem>
                  <SelectItem value="commercial">Коммерческая</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Количество комнат и Площадь - динамически */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {showRooms && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <Label htmlFor="rooms" className="text-base font-medium flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-muted-foreground" />
                  Количество комнат
                </Label>
                <Input
                  id="rooms"
                  type="number"
                  {...register("rooms", { valueAsNumber: true })}
                  placeholder="3"
                  className="h-11 text-base"
                />
              </div>
            )}

            <div className={`space-y-2 ${showRooms ? "" : "md:col-span-2"}`}>
              <Label htmlFor="area" className="text-base font-medium flex items-center gap-2">
                <Ruler className="w-4 h-4 text-muted-foreground" />
                Площадь (м²) *
              </Label>
              <div className="relative">
                <Input
                  id="area"
                  type="text"
                  inputMode="decimal"
                  value={areaDisplay}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Разрешаем только цифры, точку и запятую
                    const cleaned = value.replace(/[^\d.,]/g, "").replace(",", ".");
                    // Разрешаем только одну точку
                    const parts = cleaned.split(".");
                    const formatted = parts.length > 2 
                      ? parts[0] + "." + parts.slice(1).join("")
                      : cleaned;
                    setAreaDisplay(formatted);
                    const num = parseFloat(formatted) || 0;
                    setValue("area", num, { shouldValidate: true });
                  }}
                  onBlur={(e) => {
                    const num = parseFloat(e.target.value) || 0;
                    if (num > 0) {
                      setAreaDisplay(String(num));
                    }
                  }}
                  placeholder="75.5"
                  className="h-11 text-base pr-10 font-medium"
                  aria-label="Площадь недвижимости в квадратных метрах"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                  м²
                </span>
              </div>
              {errors.area && (
                <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.area.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Описание */}
      <Card className="border-primary/20 shadow-lg transition-all hover:shadow-xl">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5 text-primary" />
            Описание
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">
              Подробное описание недвижимости *
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Опишите недвижимость подробно: расположение, состояние, особенности, инфраструктуру рядом..."
              rows={8}
              className="text-base resize-y"
              maxLength={8000}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                if (target.value.length >= 8000) {
                  toast.warning("Достигнут лимит в 8000 символов", {
                    duration: 2000,
                  });
                }
              }}
            />
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="flex items-center gap-1">
                {errors.description ? (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.description.message}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Минимум 50 символов
                  </span>
                )}
              </span>
              <span
                className={`font-medium transition-colors ${(watch("description")?.length || 0) >= 7600
                  ? "text-destructive"
                  : (watch("description")?.length || 0) >= 7000
                    ? "text-amber-600 dark:text-amber-500"
                    : "text-muted-foreground"
                  }`}
              >
                {watch("description")?.length || 0} / 8000
              </span>
            </div>
            {/* Прогресс-бар при приближении к лимиту */}
            {/* {(watch("description")?.length || 0) >= 6000 && (
              <div className="w-full h-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.min(((watch("description")?.length || 0) / 8000) * 100, 100)}%`,
                    backgroundColor:
                      (watch("description")?.length || 0) >= 7600
                        ? "hsl(var(--destructive))"
                        : (watch("description")?.length || 0) >= 7000
                          ? "hsl(var(--accent))"
                          : "hsl(var(--primary))",
                  }}
                />
              </div> */}
            {/* )} */}
          </div>
        </CardContent>
      </Card>

      {/* Удобства */}
      {/* <AmenitiesSelector
        selectedFeatures={amenities.selectedFeatures}
        customFeature={amenities.customFeature}
        setCustomFeature={amenities.setCustomFeature}
        toggleFeature={amenities.toggleFeature}
        addCustomFeature={amenities.addCustomFeature}
        removeFeature={amenities.removeFeature}
        featuresByCategory={amenities.featuresByCategory}
      /> */}

      {/* Изображения */}
      <Card className="border-primary/20 shadow-lg transition-all hover:shadow-xl">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <CardTitle className="flex items-center justify-between text-xl">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Изображения
            </div>
            <span className="text-sm font-normal text-muted-foreground bg-background px-3 py-1 rounded-full border">
              {imagePreviews.length} / {MAX_IMAGES_PER_PROPERTY}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Dropzone / Upload Button */}
          <div
            onClick={handleSelectClick}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-200 hover:border-primary/50 hover:bg-muted/30
              ${imagePreviews.length >= MAX_IMAGES_PER_PROPERTY ? "opacity-50 pointer-events-none" : ""}
              ${imagesError ? "border-destructive bg-destructive/5" : "border-muted-foreground/30"}
            `}
          >
            <div className="flex flex-col items-center gap-3">
              {isUploading ? (
                <>
                  <Spinner className="w-12 h-12 text-primary" />
                  <p className="text-sm font-medium text-foreground">Загрузка...</p>
                  <p className="text-xs text-muted-foreground">Пожалуйста, подождите</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground mb-1">
                      Нажмите для выбора изображений
                    </p>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG или WebP. Максимум {MAX_FILE_SIZE / 1024 / 1024}MB на файл
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              multiple
              onChange={handleFilesSelect}
              className="hidden"
              disabled={imagePreviews.length >= MAX_IMAGES_PER_PROPERTY}
            />
          </div>



          {/* Error Message */}
          {imagesError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{imagesError}</p>
            </div>
          )}

          {/* Image Previews Grid */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imagePreviews.map((preview) => (
                <div
                  key={preview.id}
                  className="relative group aspect-4/3 rounded-lg overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-200"
                >
                  {/* Image */}
                  <img
                    src={preview.previewUrl}
                    alt="Превью"
                    className={`
                      w-full h-full object-cover
                      ${preview.error ? "opacity-50" : ""}
                    `}
                  />

                  {/* Loading Overlay */}
                  {preview.isUploading && (
                    <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <Spinner className="w-8 h-8 text-white" />
                    </div>
                  )}

                  {/* Error Overlay */}
                  {preview.error && (
                    <div className="absolute inset-0 bg-destructive/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center p-2">
                        <AlertCircle className="w-6 h-6 text-destructive mx-auto" />
                        <p className="text-xs text-destructive mt-1 font-medium">
                          {preview.error}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Success Indicator */}
                  {preview.uploadedUrl && !preview.error && !preview.isUploading && (
                    <div className="absolute top-2 left-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={() => removeImage(preview.id)}
                    disabled={preview.isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {imagePreviews.length === 0 && !isUploading && (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Изображения ещё не добавлены</p>
              <p className="text-xs mt-1">Добавьте хотя бы одно изображение для объявления</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Кнопка отправки */}
      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="submit"
          className="btn-caucasus min-w-[200px] h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
          disabled={isSubmitDisabled}
        >
          {isLoading ? (
            <>
              <Spinner className="w-5 h-5 mr-2" />
              {isEdit ? "Сохранение..." : "Создание..."}
            </>
          ) : hasUploadingImages ? (
            <>
              <Spinner className="w-5 h-5 mr-2" />
              Загрузка изображений...
            </>
          ) : (
            <>
              {isEdit ? "Сохранить изменения" : "Создать объявление"}
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
