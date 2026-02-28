"use client";

import type { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard } from "../SectionCard";
import type { PropertyFormData } from "../schema";
import { formatNumberWithSpaces, parseFormattedNumber } from "../schema";
import { Home, FileText, DollarSign, Building2, AlertCircle } from "lucide-react";

interface BasicSectionProps {
  register: UseFormRegister<PropertyFormData>;
  setValue: UseFormSetValue<PropertyFormData>;
  watch: UseFormWatch<PropertyFormData>;
  errors: Record<string, { message?: string } | undefined>;
  priceDisplay: string;
  setPriceDisplay: (v: string) => void;
}

export function BasicSection({
  register,
  setValue,
  watch,
  errors,
  priceDisplay,
  setPriceDisplay,
}: BasicSectionProps) {
  return (
    <SectionCard
      title='Основная информация'
      icon={<Home className='h-4 w-4 text-primary' />}
    >
      {/* Заголовок */}
      <div className='mb-4'>
        <div className='space-y-1'>
          <Label htmlFor='title' className='flex items-center gap-2 text-sm font-medium'>
            <FileText className='h-3.5 w-3.5 text-muted-foreground' />
            Заголовок <span className='text-destructive'>*</span>
            <span className='ml-auto text-xs text-muted-foreground'>
              {watch("title")?.length ?? 0} / 200
            </span>
          </Label>
          <Textarea
            id='title'
            {...register("title")}
            placeholder='Например: 3-комнатная квартира в центре'
            maxLength={200}
            rows={2}
            className='resize-none min-h-[72px] text-sm'
          />
          {errors.title ? (
            <p className='text-xs text-destructive flex items-center gap-1'>
              <AlertCircle className='h-3 w-3 shrink-0' />
              {errors.title.message}
            </p>
          ) : (
            <p className='text-xs text-muted-foreground'>Минимум 10 символов</p>
          )}
        </div>
      </div>
      {/* Основные поля в ряд */}
      <div className='flex flex-col gap-4 md:flex-row md:gap-6'>
        {/* Тип сделки */}
        <div className='space-y-1 flex-1 min-w-[180px]'>
          <Label className='text-sm font-medium'>
            <DollarSign className='h-3.5 w-3.5 text-muted-foreground inline mr-1.5' />
            Тип сделки <span className='text-destructive'>*</span>
          </Label>
          <Select
            value={watch("dealType")}
            onValueChange={(v) => setValue("dealType", v as PropertyFormData["dealType"])}
          >
            <SelectTrigger className='h-10 w-full' aria-label='Тип сделки'>
              <SelectValue placeholder='Тип сделки' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='SALE'>Продаю</SelectItem>
              <SelectItem value='BUY'>Куплю</SelectItem>
              <SelectItem value='RENT_OUT'>Сдаю</SelectItem>
              <SelectItem value='RENT_IN'>Сниму</SelectItem>
              <SelectItem value='EXCHANGE'>Обмен</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Тип недвижимости */}
        <div className='space-y-1 flex-1 min-w-[180px]'>
          <Label className='text-sm font-medium'>
            <Building2 className='h-3.5 w-3.5 text-muted-foreground inline mr-1.5' />
            Тип недвижимости <span className='text-destructive'>*</span>
          </Label>
          <Select
            value={watch("type")}
            onValueChange={(v) => setValue("type", v as PropertyFormData["type"])}
          >
            <SelectTrigger className='h-10 w-full' aria-label='Тип недвижимости'>
              <SelectValue placeholder='Тип' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='apartment'>Квартира</SelectItem>
              <SelectItem value='house'>Дом</SelectItem>
              <SelectItem value='land'>Земельный участок</SelectItem>
              <SelectItem value='commercial'>Коммерческая</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Цена */}
        <div className='space-y-1 flex-1 min-w-[180px]'>
          <Label htmlFor='price' className='text-sm font-medium'>
            Цена{" "}
            {watch("dealType") !== "BUY" && <span className='text-destructive'>*</span>}
          </Label>
          <div className='relative'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium'>
              ₽
            </span>
            <Input
              id='price'
              type='text'
              inputMode='numeric'
              value={priceDisplay}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, "");
                const num = parseFormattedNumber(cleaned);
                setPriceDisplay(cleaned ? formatNumberWithSpaces(cleaned) : "");
                setValue("price", num, { shouldValidate: true });
              }}
              onBlur={(e) => {
                const num = parseFormattedNumber(e.target.value);
                if (num > 0) setPriceDisplay(formatNumberWithSpaces(num));
                else setPriceDisplay("");
              }}
              placeholder={watch("dealType") === "BUY" ? "Договорённость" : "5 000 000"}
              className='h-10 pl-8 font-medium w-full'
              autoComplete='off'
            />
          </div>
          {errors.price && (
            <p className='text-xs text-destructive flex items-center gap-1'>
              <AlertCircle className='h-3 w-3' />
              {errors.price.message}
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
