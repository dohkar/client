"use client";

import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
} from "react-hook-form";
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

/** Комнаты в форме объявления: 0 = студия; unset = не указано. */
const ROOMS_UNSET = "unset";

const LISTING_ROOMS_SELECT: { value: string; label: string }[] = [
  { value: ROOMS_UNSET, label: "Не указано" },
  { value: "0", label: "Студия" },
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
    value: String(n),
    label: String(n),
  })),
];

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

export function RealEstateBlock({
  register,
  setValue,
  watch,
  errors,
}: RealEstateBlockProps) {
  const propertyType = watch("realEstate.type");
  const rooms = watch("realEstate.rooms");

  return (
    <div className='space-y-4 rounded-lg border p-4'>
      <h3 className='font-semibold'>Недвижимость</h3>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label>Тип недвижимости</Label>
          <Select
            value={propertyType}
            onValueChange={(v) =>
              setValue(
                "realEstate.type",
                v as "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL"
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder='Выберите тип' />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label>Площадь (м²)</Label>
          <Input
            type='number'
            step='0.1'
            min='0'
            {...register("realEstate.area", { valueAsNumber: true })}
            placeholder='75.5'
          />
        </div>

        {propertyType !== "LAND" && (
          <div className='space-y-2'>
            <Label>Комнат</Label>
            <Select
              value={rooms === undefined || rooms === null ? ROOMS_UNSET : String(rooms)}
              onValueChange={(v) => {
                if (v === ROOMS_UNSET) {
                  setValue("realEstate.rooms", undefined);
                } else {
                  setValue("realEstate.rooms", Number(v));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder='Выберите' />
              </SelectTrigger>
              <SelectContent>
                {LISTING_ROOMS_SELECT.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.realEstate?.rooms && (
              <p className='text-sm text-destructive'>
                {errors.realEstate.rooms.message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
