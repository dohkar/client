"use client";

import * as z from "zod";
import type {
  UseFormRegister,
  UseFormHandleSubmit,
  FieldErrors,
  UseFormSetValue,
} from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { User, Mail, Phone, ImageIcon, AlertCircle, Upload, Camera } from "lucide-react";
import { formatPhoneInput } from "@/lib/utils/format";
import { ALLOWED_IMAGE_TYPES } from "@/services/upload.service";

const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Имя должно содержать минимум 2 символа")
    .max(50, "Имя не должно превышать 50 символов")
    .regex(
      /^[a-zA-Zа-яА-ЯёЁ\s-]+$/,
      "Имя может содержать только буквы, пробелы и дефисы"
    ),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[0-9\s\-()]{10,20}$/.test(val),
      "Введите корректный номер телефона"
    ),
  email: z
    .string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Введите корректный email"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: {
    name: string | null | undefined;
    email: string | null | undefined;
    phone: string | null | undefined;
    avatar: string | null | undefined;
  };
  displayAvatarUrl?: string;
  isAvatarUploading: boolean;
  onAvatarClick: () => void;
  onSubmit: (data: ProfileFormData) => void;
  onReset: () => void;
  isDirty: boolean;
  changedFieldsCount: number;
  isSubmitting: boolean;
  register: UseFormRegister<ProfileFormData>;
  handleSubmit: UseFormHandleSubmit<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
  setValue: UseFormSetValue<ProfileFormData>;
}

export function ProfileForm({
  user,
  displayAvatarUrl,
  isAvatarUploading,
  onAvatarClick,
  onSubmit,
  onReset,
  isDirty,
  changedFieldsCount,
  isSubmitting,
  register,
  handleSubmit,
  errors,
  setValue,
}: ProfileFormProps) {
  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0'>
          <div className='w-full sm:w-auto'>
            <CardTitle className='flex items-center gap-2'>
              <User className='w-5 h-5' />
              Личная информация
            </CardTitle>
            <CardDescription>Обновите данные вашего профиля</CardDescription>
          </div>
          {isDirty && (
            <Badge variant='outline' className='text-amber-600 border-amber-300'>
              {changedFieldsCount} {changedFieldsCount === 1 ? "изменение" : "изменения"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* Avatar Upload Section */}
          <div className='space-y-3'>
            <Label className='flex items-center gap-2'>
              <ImageIcon className='w-4 h-4 text-muted-foreground' />
              Аватар
            </Label>

            <div className='flex flex-col sm:flex-row items-start gap-3 sm:gap-4'>
              {/* Avatar Preview with Upload Button */}
              <div className='relative group'>
                <button
                  type='button'
                  onClick={onAvatarClick}
                  disabled={isAvatarUploading}
                  className='relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full'
                >
                  <Avatar className='w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed border-muted-foreground/30 transition-all group-hover:border-primary/50'>
                    <AvatarImage src={displayAvatarUrl} alt='Превью' />
                    <AvatarFallback className='bg-muted/50'>
                      <ImageIcon className='w-8 h-8 text-muted-foreground/50' />
                    </AvatarFallback>
                  </Avatar>

                  {/* Loading Overlay */}
                  {isAvatarUploading && (
                    <div className='absolute inset-0 rounded-full bg-black/50 flex items-center justify-center'>
                      <Spinner className='w-8 h-8 text-white' />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  {!isAvatarUploading && (
                    <div className='absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100'>
                      <Camera className='w-6 h-6 text-white' />
                    </div>
                  )}
                </button>
              </div>

              {/* Upload Instructions */}
              <div className='flex-1 space-y-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={onAvatarClick}
                  disabled={isAvatarUploading}
                  className='gap-2'
                >
                  {isAvatarUploading ? (
                    <>
                      <Spinner className='w-4 h-4' />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <Upload className='w-4 h-4' />
                      Выбрать файл
                    </>
                  )}
                </Button>
                <p className='text-xs text-muted-foreground'>
                  JPG, PNG или WebP. Максимум 5MB.
                </p>
                <p className='text-xs text-muted-foreground'>
                  Изображение будет автоматически оптимизировано.
                </p>
              </div>
            </div>
          </div>

          {/* Name & Phone Grid */}
          <div className='grid gap-4 md:grid-cols-2'>
            {/* Name Field */}
            <div className='space-y-2'>
              <Label htmlFor='name' className='flex items-center gap-2'>
                <User className='w-4 h-4 text-muted-foreground' />
                Имя
                <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='name'
                {...register("name")}
                placeholder='Введите ваше имя'
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className='text-xs text-destructive flex items-center gap-1'>
                  <AlertCircle className='w-3 h-3' />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div className='space-y-2'>
              <Label htmlFor='phone' className='flex items-center gap-2'>
                <Phone className='w-4 h-4 text-muted-foreground' />
                Телефон
              </Label>
              <Input
                id='phone'
                type='tel'
                {...register("phone", {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const formatted = formatPhoneInput(e.target.value);
                    setValue("phone", formatted, { shouldValidate: true });
                  },
                })}
                placeholder='+7 (___) __-__-__'
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className='text-xs text-destructive flex items-center gap-1'>
                  <AlertCircle className='w-3 h-3' />
                  {errors.phone.message}
                </p>
              )}
              <p className='text-xs text-muted-foreground'>Формат: +7 (XXX) XXX-XX-XX</p>
            </div>
          </div>

          {/* Email Field (optional, editable) */}
          <div className='space-y-2'>
            <Label htmlFor='email' className='flex items-center gap-2'>
              <Mail className='w-4 h-4 text-muted-foreground' />
              Email
            </Label>
            <Input
              id='email'
              type='email'
              placeholder='email@example.com'
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className='text-xs text-destructive flex items-center gap-1'>
                <AlertCircle className='w-3 h-3' />
                {errors.email.message}
              </p>
            )}
            <p className='text-xs text-muted-foreground'>
              Необязательно. Можно оставить пустым или указать для уведомлений.
            </p>
          </div>

          {/* Form Actions */}
          <div className='flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t'>
            <p className='text-xs text-muted-foreground text-center sm:text-left'>
              {isDirty ? "Есть несохранённые изменения" : "Все изменения сохранены"}
            </p>
            <div className='flex gap-2'>
              <Button
                type='button'
                variant='ghost'
                onClick={onReset}
                disabled={!isDirty || isSubmitting}
              >
                Отмена
              </Button>
              <Button
                type='submit'
                disabled={!isDirty || isSubmitting}
                className='min-w-[120px]'
              >
                {isSubmitting ? (
                  <>
                    <Spinner className='w-4 h-4 mr-2' />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить"
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
