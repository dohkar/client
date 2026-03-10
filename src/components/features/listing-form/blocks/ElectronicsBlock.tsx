"use client";

import { useQuery } from "@tanstack/react-query";
import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brandsService } from "@/services/brands.service";
import { queryKeys } from "@/lib/react-query/query-keys";
import type { ListingFormData } from "../schema";

interface ElectronicsBlockProps {
  register: UseFormRegister<ListingFormData>;
  setValue: UseFormSetValue<ListingFormData>;
  watch: UseFormWatch<ListingFormData>;
  errors: FieldErrors<ListingFormData>;
}

const PRODUCT_TYPES = [
  { value: "PHONE", label: "Телефон" },
  { value: "TABLET", label: "Планшет" },
  { value: "LAPTOP", label: "Ноутбук" },
  { value: "OTHER", label: "Другое" },
] as const;

export function ElectronicsBlock({ register, setValue, watch, errors }: ElectronicsBlockProps) {
  const { data: brands = [] } = useQuery({
    queryKey: queryKeys.brands.list("ELECTRONICS"),
    queryFn: () => brandsService.getBrands("ELECTRONICS"),
    staleTime: 10 * 60 * 1000,
  });

  const brandId = watch("electronics.brandId");
  const productType = watch("electronics.productType");

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold">Электроника</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Бренд</Label>
          <Select value={brandId} onValueChange={(v) => setValue("electronics.brandId", v)}>
            <SelectTrigger><SelectValue placeholder="Выберите бренд" /></SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Тип устройства</Label>
          <Select value={productType} onValueChange={(v) => setValue("electronics.productType", v)}>
            <SelectTrigger><SelectValue placeholder="Тип" /></SelectTrigger>
            <SelectContent>
              {PRODUCT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Модель</Label>
          <Input {...register("electronics.model")} placeholder="iPhone 15 Pro" />
        </div>

        <div className="space-y-2">
          <Label>Память</Label>
          <Input {...register("electronics.storage")} placeholder="256 GB" />
        </div>

        <div className="space-y-2">
          <Label>Состояние</Label>
          <Input {...register("electronics.condition")} placeholder="Б/у, отличное" />
        </div>
      </div>
    </div>
  );
}
