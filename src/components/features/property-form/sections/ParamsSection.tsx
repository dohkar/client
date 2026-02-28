"use client";

import type { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SectionCard } from "../SectionCard";
import type { PropertyFormData } from "../schema";
import { Ruler, DoorOpen } from "lucide-react";
import { AlertCircle } from "lucide-react";

interface ParamsSectionProps {
  register: UseFormRegister<PropertyFormData>;
  setValue: UseFormSetValue<PropertyFormData>;
  watch: UseFormWatch<PropertyFormData>;
  errors: Record<string, { message?: string } | undefined>;
  areaDisplay: string;
  setAreaDisplay: (v: string) => void;
}

export function ParamsSection({
  register,
  setValue,
  watch,
  errors,
  areaDisplay,
  setAreaDisplay,
}: ParamsSectionProps) {
  const propertyType = watch("type");
  const showRooms = propertyType === "apartment" || propertyType === "house";

  return (
    <SectionCard title="Параметры объекта" icon={<Ruler className="h-4 w-4 text-primary" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {showRooms && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="rooms" className="text-sm font-medium flex items-center gap-1.5">
                <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
                Комнат
              </Label>
              <Input
                id="rooms"
                type="number"
                {...register("rooms", { valueAsNumber: true })}
                min={1}
                step={1}
                placeholder="3"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="floor" className="text-sm font-medium">Этаж</Label>
              <Input
                id="floor"
                type="number"
                {...register("floor", {
                  valueAsNumber: true,
                  setValueAs: (v) => (v === "" || Number.isNaN(v) ? undefined : v),
                })}
                min={0}
                step={1}
                placeholder="Не указан"
                className="h-10"
                aria-label="Этаж"
              />
            </div>
          </>
        )}
        <div className={showRooms ? "" : "md:col-span-2"}>
          <Label htmlFor="area" className="text-sm font-medium flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
            Площадь <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="area"
              type="text"
              inputMode="decimal"
              value={areaDisplay}
              onChange={(e) => {
                const value = e.target.value;
                const cleaned = value.replace(/[^\d.,]/g, "").replace(",", ".");
                const parts = cleaned.split(".");
                const formatted =
                  parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
                setAreaDisplay(formatted);
                const num = parseFloat(formatted) || 0;
                setValue("area", num, { shouldValidate: true });
              }}
              onBlur={(e) => {
                const num = parseFloat(e.target.value) || 0;
                if (num > 0) setAreaDisplay(String(num));
              }}
              placeholder="75.5"
              className="h-10 pr-10 font-medium"
              aria-label="Площадь"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
              м²
            </span>
          </div>
          {errors.area && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.area.message}
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
