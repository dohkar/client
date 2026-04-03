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
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { listingsService } from "@/services/listings.service";
import { LISTING_CATEGORIES } from "@/constants/listing-categories";
import type { ListingCategory } from "@/types/listing";
import type { Listing } from "@/types/listing";
import { listingSchema } from "./schema";
import type { ListingFormData } from "./schema";
import {
  EMPTY_LISTING_FORM_DEFAULTS,
  buildListingFormDefaults,
} from "./listing-form-defaults";
import { RealEstateBlock } from "./blocks/RealEstateBlock";
import { VehicleBlock } from "./blocks/VehicleBlock";
import { ElectronicsBlock } from "./blocks/ElectronicsBlock";

const CATEGORY_FORM_BLOCKS: Record<
  ListingCategory,
  React.FC<{
    register: ReturnType<typeof useForm<ListingFormData>>["register"];
    setValue: ReturnType<typeof useForm<ListingFormData>>["setValue"];
    watch: ReturnType<typeof useForm<ListingFormData>>["watch"];
    errors: ReturnType<typeof useForm<ListingFormData>>["formState"]["errors"];
  }>
> = {
  REAL_ESTATE: RealEstateBlock,
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
  /** Режим редактирования: PATCH /api/listings/:id */
  listingId?: string;
  initialListing?: Listing | null;
}

export function ListingForm({ onSuccess, listingId, initialListing }: ListingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = Boolean(listingId);
  const queryClient = useQueryClient();

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
    }
  }, [initialListing, reset]);

  const category = watch("category");
  const CategoryBlock = CATEGORY_FORM_BLOCKS[category];

  const onSubmit = async (data: ListingFormData) => {
    setIsLoading(true);
    try {
      const priceRubles = data.price ?? 0;

      const payload: Record<string, unknown> = {
        category: data.category,
        title: data.title,
        dealType: data.dealType,
        price: priceRubles,
        currency: "RUB",
        description: data.description,
        images:
          isEdit && initialListing?.images?.length ? [...initialListing.images] : [],
        location: data.location,
        regionId: data.regionId || undefined,
        cityId: data.cityId || undefined,
        street: data.street,
        house: data.house,
        floor: data.floor ?? undefined,
      };

      if (data.category === "REAL_ESTATE" && data.realEstate) {
        payload.realEstate = data.realEstate;
      }
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

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className='max-w-4xl w-full mx-auto space-y-5 pb-24 md:pb-8'
    >
      {/* Category selector */}
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

      {/* Base fields */}
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

      {/* Category-specific block */}
      <CategoryBlock
        register={register}
        setValue={setValue}
        watch={watch}
        errors={errors}
      />

      {/* Submit */}
      <Button type='submit' className='w-full' size='lg' disabled={isLoading}>
        {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
        {listingId ? "Сохранить изменения" : "Создать объявление"}
      </Button>
    </form>
  );
}
