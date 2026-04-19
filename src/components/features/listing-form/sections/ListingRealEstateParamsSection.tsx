"use client";

import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard } from "@/components/features/property-form/SectionCard";
import type { ListingFormData } from "../schema";
import { Ruler, DoorOpen, AlertCircle, Building2 } from "lucide-react";

/** Комнаты: 0 = студия; unset = не указано. */
const ROOMS_UNSET = "unset";

const LISTING_ROOMS_SELECT: { value: string; label: string }[] = [
  { value: ROOMS_UNSET, label: "Не указано" },
  { value: "0", label: "Студия" },
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
    value: String(n),
    label: String(n),
  })),
];

interface ListingRealEstateParamsSectionProps {
  register: UseFormRegister<ListingFormData>;
  setValue: UseFormSetValue<ListingFormData>;
  watch: UseFormWatch<ListingFormData>;
  errors: FieldErrors<ListingFormData>;
  areaDisplay: string;
  setAreaDisplay: (v: string) => void;
}

export function ListingRealEstateParamsSection({
  register,
  setValue,
  watch,
  errors,
  areaDisplay,
  setAreaDisplay,
}: ListingRealEstateParamsSectionProps) {
  const propertyType = watch("realEstate.type");
  const showRooms = propertyType === "APARTMENT" || propertyType === "HOUSE";
  const rooms = watch("realEstate.rooms");

  return (
    <SectionCard
      title='Параметры объекта'
      icon={<Ruler className='h-4 w-4 text-primary' />}
    >
      <div className='mb-4 space-y-1.5'>
        <Label className='text-sm font-medium'>
          <Building2 className='mr-1.5 inline h-3.5 w-3.5 text-muted-foreground' />
          Тип недвижимости <span className='text-destructive'>*</span>
        </Label>
        <Select
          value={watch("realEstate.type")}
          onValueChange={(v) =>
            setValue(
              "realEstate.type",
              v as "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL"
            )
          }
        >
          <SelectTrigger className='h-10 w-full max-w-md' aria-label='Тип недвижимости'>
            <SelectValue placeholder='Тип' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='APARTMENT'>Квартира</SelectItem>
            <SelectItem value='HOUSE'>Дом</SelectItem>
            <SelectItem value='LAND'>Земельный участок</SelectItem>
            <SelectItem value='COMMERCIAL'>Коммерческая</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
        {showRooms && (
          <>
            <div className='space-y-1.5'>
              <Label className='text-sm font-medium flex items-center gap-1.5'>
                <DoorOpen className='h-3.5 w-3.5 text-muted-foreground' />
                Комнат
              </Label>
              <Select
                value={
                  rooms === undefined || rooms === null ? ROOMS_UNSET : String(rooms)
                }
                onValueChange={(v) => {
                  if (v === ROOMS_UNSET) {
                    setValue("realEstate.rooms", undefined);
                  } else {
                    setValue("realEstate.rooms", Number(v));
                  }
                }}
              >
                <SelectTrigger className='h-10' aria-label='Количество комнат'>
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
              {errors.realEstate?.rooms?.message ? (
                <p className='text-xs text-destructive flex items-center gap-1'>
                  <AlertCircle className='h-3 w-3' />
                  {errors.realEstate.rooms.message}
                </p>
              ) : null}
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='listing-re-floor' className='text-sm font-medium'>
                Этаж
              </Label>
              <Input
                id='listing-re-floor'
                type='number'
                {...register("floor", {
                  valueAsNumber: true,
                  setValueAs: (v) => (v === "" || Number.isNaN(v) ? undefined : v),
                })}
                min={0}
                step={1}
                placeholder='Не указан'
                className='h-10'
                aria-label='Этаж'
              />
            </div>
          </>
        )}
        <div className={showRooms ? "" : "md:col-span-2"}>
          <Label
            htmlFor='listing-re-area'
            className='text-sm font-medium flex items-center gap-1.5'
          >
            <Ruler className='h-3.5 w-3.5 text-muted-foreground' />
            Площадь <span className='text-destructive'>*</span>
          </Label>
          <div className='relative'>
            <Input
              id='listing-re-area'
              type='text'
              inputMode='decimal'
              value={areaDisplay}
              onChange={(e) => {
                const value = e.target.value;
                const cleaned = value.replace(/[^\d.,]/g, "").replace(",", ".");
                const parts = cleaned.split(".");
                const formatted =
                  parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
                setAreaDisplay(formatted);
                const num = parseFloat(formatted) || 0;
                setValue("realEstate.area", num, { shouldValidate: true });
              }}
              onBlur={(e) => {
                const num = parseFloat(e.target.value) || 0;
                if (num > 0) setAreaDisplay(String(num));
              }}
              placeholder='75.5'
              className='h-10 pr-10 font-medium'
              aria-label='Площадь'
            />
            <span className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium'>
              м²
            </span>
          </div>
          {errors.realEstate?.area && (
            <p className='text-xs text-destructive flex items-center gap-1 mt-1'>
              <AlertCircle className='h-3 w-3' />
              {errors.realEstate.area.message}
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
