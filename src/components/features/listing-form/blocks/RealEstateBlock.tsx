"use client";

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
import type { ListingFormData } from "../schema";

interface RealEstateBlockProps {
  register: UseFormRegister<ListingFormData>;
  setValue: UseFormSetValue<ListingFormData>;
  watch: UseFormWatch<ListingFormData>;
  errors: FieldErrors<ListingFormData>;
}

const PROPERTY_TYPES = [
  { value: "APARTMENT", label: "Квартира" },
  { value: "HOUSE", label: "Дом" },
  { value: "LAND", label: "Участок" },
  { value: "COMMERCIAL", label: "Коммерция" },
] as const;

export function RealEstateBlock({ register, setValue, watch, errors }: RealEstateBlockProps) {
  const propertyType = watch("realEstate.type");

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold">Недвижимость</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Тип недвижимости</Label>
          <Select
            value={propertyType}
            onValueChange={(v) =>
              setValue("realEstate.type", v as "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL")
            }
          >
            <SelectTrigger><SelectValue placeholder="Выберите тип" /></SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Площадь (м²)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            {...register("realEstate.area", { valueAsNumber: true })}
            placeholder="75.5"
          />
        </div>

        {propertyType !== "LAND" && (
          <div className="space-y-2">
            <Label>Комнат</Label>
            <Input
              type="number"
              min="0"
              {...register("realEstate.rooms", { valueAsNumber: true })}
              placeholder="3"
            />
          </div>
        )}
      </div>
    </div>
  );
}
