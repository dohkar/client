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

interface VehicleBlockProps {
  register: UseFormRegister<ListingFormData>;
  setValue: UseFormSetValue<ListingFormData>;
  watch: UseFormWatch<ListingFormData>;
  errors: FieldErrors<ListingFormData>;
}

export function VehicleBlock({ register, setValue, watch, errors }: VehicleBlockProps) {
  const { data: brands = [] } = useQuery({
    queryKey: queryKeys.brands.list("VEHICLE"),
    queryFn: () => brandsService.getBrands("VEHICLE"),
    staleTime: 10 * 60 * 1000,
  });

  const brandId = watch("vehicle.brandId");

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold">Транспорт</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Марка</Label>
          <Select value={brandId} onValueChange={(v) => setValue("vehicle.brandId", v)}>
            <SelectTrigger><SelectValue placeholder="Выберите марку" /></SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Модель</Label>
          <Input {...register("vehicle.model")} placeholder="Camry" />
        </div>

        <div className="space-y-2">
          <Label>Год выпуска</Label>
          <Input
            type="number"
            min="1900"
            max="2100"
            {...register("vehicle.year", { valueAsNumber: true })}
            placeholder="2020"
          />
        </div>

        <div className="space-y-2">
          <Label>Пробег (км)</Label>
          <Input
            type="number"
            min="0"
            {...register("vehicle.mileage", { valueAsNumber: true })}
            placeholder="85000"
          />
        </div>

        <div className="space-y-2">
          <Label>Кузов</Label>
          <Input {...register("vehicle.bodyType")} placeholder="Седан" />
        </div>

        <div className="space-y-2">
          <Label>Двигатель</Label>
          <Input {...register("vehicle.engine")} placeholder="2.5L Бензин" />
        </div>

        <div className="space-y-2">
          <Label>КПП</Label>
          <Input {...register("vehicle.transmission")} placeholder="Автомат" />
        </div>
      </div>
    </div>
  );
}
