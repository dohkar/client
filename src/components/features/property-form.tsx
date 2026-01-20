"use client";

import { useState, useRef, useCallback } from "react";
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
import { propertyService } from "@/services/property.service";
import {
  uploadService,
  validateImageFiles,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGES_PER_PROPERTY,
} from "@/services/upload.service";
import { toast } from "sonner";
import type { Property } from "@/types/property";
import { Upload, X, ImageIcon, AlertCircle } from "lucide-react";

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
  currency: z.enum(["RUB", "USD"]),
  location: z.string().min(5, "Адрес должен быть не менее 5 символов"),
  region: z.enum(["Chechnya", "Ingushetia", "Other"]),
  type: z.enum(["apartment", "house", "land", "commercial"]),
  rooms: z.number().optional(),
  area: z.number().min(1, "Площадь должна быть больше 0"),
  description: z.string().min(50, "Описание должно быть не менее 50 символов"),
  features: z.array(z.string()).optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  onSuccess?: (property: Property) => void;
  initialData?: Partial<Property>;
  isEdit?: boolean;
}

// Генерация уникального ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function PropertyForm({ onSuccess, initialData, isEdit = false }: PropertyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // При редактировании инициализируем превью из существующих URL
  useState(() => {
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
      title: initialData?.title || "",
      price: initialData?.price || 0,
      currency: initialData?.currency || "RUB",
      location: initialData?.location || "",
      region: initialData?.region || "Other",
      type: initialData?.type || "apartment",
      rooms: initialData?.rooms,
      area: initialData?.area || 0,
      description: initialData?.description || "",
      features: initialData?.features || [],
    },
  });

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
      // Конвертация frontend формата в API формат
      const regionMap: Record<string, "CHECHNYA" | "INGUSHETIA" | "OTHER"> = {
        Chechnya: "CHECHNYA",
        Ingushetia: "INGUSHETIA",
        Other: "OTHER",
      };
      const typeMap: Record<string, "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL"> = {
        apartment: "APARTMENT",
        house: "HOUSE",
        land: "LAND",
        commercial: "COMMERCIAL",
      };

      // Собираем URL загруженных изображений
      const imageUrls = uploadedImages.map((p) => p.uploadedUrl!);

      const apiData = {
        title: data.title,
        price: data.price,
        currency: data.currency,
        location: data.location,
        region: regionMap[data.region] || "OTHER",
        type: typeMap[data.type] || "APARTMENT",
        rooms: data.rooms,
        area: data.area,
        description: data.description,
        images: imageUrls,
        features: data.features || [],
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
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Заголовок объявления *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Например: 3-комнатная квартира в центре"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Цена *</Label>
              <Input
                id="price"
                type="number"
                {...register("price", { valueAsNumber: true })}
                placeholder="5000000"
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Валюта *</Label>
              <Select
                value={watch("currency")}
                onValueChange={(value) => setValue("currency", value as "RUB" | "USD")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RUB">₽ RUB</SelectItem>
                  <SelectItem value="USD">$ USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Адрес *</Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="г. Грозный, ул. Ленина, д. 10"
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">Регион *</Label>
              <Select
                value={watch("region")}
                onValueChange={(value) =>
                  setValue("region", value as "Chechnya" | "Ingushetia" | "Other")
                }
              >
                <SelectTrigger>
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
              <Label htmlFor="type">Тип недвижимости *</Label>
              <Select
                value={watch("type")}
                onValueChange={(value) =>
                  setValue("type", value as "apartment" | "house" | "land" | "commercial")
                }
              >
                <SelectTrigger>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rooms">Количество комнат</Label>
              <Input
                id="rooms"
                type="number"
                {...register("rooms", { valueAsNumber: true })}
                placeholder="3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Площадь (м²) *</Label>
              <Input
                id="area"
                type="number"
                step="0.1"
                {...register("area", { valueAsNumber: true })}
                placeholder="75.5"
              />
              {errors.area && (
                <p className="text-sm text-destructive">{errors.area.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Описание</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Описание *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Подробное описание недвижимости..."
              rows={6}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Изображения</span>
            <span className="text-sm font-normal text-muted-foreground">
              {imagePreviews.length} / {MAX_IMAGES_PER_PROPERTY}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dropzone / Upload Button */}
          <div
            onClick={handleSelectClick}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors hover:border-primary/50 hover:bg-muted/50
              ${imagePreviews.length >= MAX_IMAGES_PER_PROPERTY ? "opacity-50 pointer-events-none" : ""}
              ${imagesError ? "border-destructive" : "border-muted-foreground/30"}
            `}
          >
            <div className="flex flex-col items-center gap-2">
              {isUploading ? (
                <>
                  <Spinner className="w-10 h-10 text-primary" />
                  <p className="text-sm text-muted-foreground">Загрузка...</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Нажмите для выбора изображений
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG или WebP. Максимум {MAX_FILE_SIZE / 1024 / 1024}MB на файл.
                  </p>
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
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {imagesError}
            </p>
          )}

          {/* Image Previews Grid */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imagePreviews.map((preview) => (
                <div key={preview.id} className="relative group aspect-[4/3]">
                  {/* Image */}
                  <img
                    src={preview.previewUrl}
                    alt="Превью"
                    className={`
                      w-full h-full object-cover rounded-lg
                      ${preview.error ? "opacity-50" : ""}
                    `}
                  />

                  {/* Loading Overlay */}
                  {preview.isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <Spinner className="w-8 h-8 text-white" />
                    </div>
                  )}

                  {/* Error Overlay */}
                  {preview.error && (
                    <div className="absolute inset-0 bg-destructive/20 rounded-lg flex items-center justify-center">
                      <div className="text-center p-2">
                        <AlertCircle className="w-6 h-6 text-destructive mx-auto" />
                        <p className="text-xs text-destructive mt-1">{preview.error}</p>
                      </div>
                    </div>
                  )}

                  {/* Success Indicator */}
                  {preview.uploadedUrl && !preview.error && !preview.isUploading && (
                    <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
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
                    className="absolute top-2 right-2 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
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
            <div className="text-center py-4 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Изображения ещё не добавлены</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" className="btn-caucasus" disabled={isSubmitDisabled}>
          {isLoading ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              {isEdit ? "Сохранение..." : "Создание..."}
            </>
          ) : hasUploadingImages ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Загрузка изображений...
            </>
          ) : isEdit ? (
            "Сохранить изменения"
          ) : (
            "Создать объявление"
          )}
        </Button>
      </div>
    </form>
  );
}
