"use client";

import { useState } from "react";
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
import { propertyService } from "@/services/property.service";
import { toast } from "sonner";
import type { Property } from "@/types/property";

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
  images: z.array(z.string().url()).min(1, "Добавьте хотя бы одно изображение"),
  features: z.array(z.string()).optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  onSuccess?: (property: Property) => void;
  initialData?: Partial<Property>;
  isEdit?: boolean;
}

export function PropertyForm({ onSuccess, initialData, isEdit = false }: PropertyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialData?.images && initialData.images.length > 0
      ? initialData.images
      : initialData?.image
      ? [initialData.image]
      : []
  );
  const [imageInput, setImageInput] = useState("");

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
      images: imageUrls,
      features: initialData?.features || [],
    },
  });

  const addImage = () => {
    if (imageInput.trim() && imageInput.startsWith("http")) {
      setImageUrls([...imageUrls, imageInput.trim()]);
      setValue("images", [...imageUrls, imageInput.trim()]);
      setImageInput("");
    }
  };

  const removeImage = (index: number) => {
    const newImages = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newImages);
    setValue("images", newImages);
  };

  const onSubmit = async (data: PropertyFormData) => {
    setIsLoading(true);
    try {
      // Convert frontend format to API format
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
          <CardTitle>Изображения</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="URL изображения"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImage();
                }
              }}
            />
            <Button type="button" onClick={addImage} variant="outline">
              Добавить
            </Button>
          </div>

          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Изображение ${index + 1}`}
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}

          {errors.images && (
            <p className="text-sm text-destructive">{errors.images.message}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" className="btn-caucasus" disabled={isLoading}>
          {isLoading
            ? isEdit
              ? "Сохранение..."
              : "Создание..."
            : isEdit
            ? "Сохранить изменения"
            : "Создать объявление"}
        </Button>
      </div>
    </form>
  );
}
