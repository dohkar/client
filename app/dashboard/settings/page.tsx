"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, "Пароль должен быть не менее 6 символов"),
    newPassword: z.string().min(6, "Пароль должен быть не менее 6 символов"),
    confirmPassword: z
      .string()
      .min(6, "Пароль должен быть не менее 6 символов"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Пароль успешно изменен");
      reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ошибка изменения пароля"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container mx-auto px-4 py-12'>
      <div className='max-w-2xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold mb-2'>Настройки</h1>
          <p className='text-muted-foreground'>
            Управляйте настройками аккаунта
          </p>
        </div>

        <Card className='border-primary/20 mb-6'>
          <CardHeader>
            <CardTitle>Изменить пароль</CardTitle>
            <CardDescription>
              Обновите пароль для вашего аккаунта
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='currentPassword'>Текущий пароль</Label>
                <Input
                  id='currentPassword'
                  type='password'
                  {...register("currentPassword")}
                />
                {errors.currentPassword && (
                  <p className='text-sm text-destructive'>
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='newPassword'>Новый пароль</Label>
                <Input
                  id='newPassword'
                  type='password'
                  {...register("newPassword")}
                />
                {errors.newPassword && (
                  <p className='text-sm text-destructive'>
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>
                  Подтвердите новый пароль
                </Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className='text-sm text-destructive'>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className='flex justify-end'>
                <Button
                  type='submit'
                  className='btn-caucasus'
                  disabled={isLoading}
                >
                  {isLoading ? "Сохранение..." : "Изменить пароль"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className='border-primary/20'>
          <CardHeader>
            <CardTitle>Уведомления</CardTitle>
            <CardDescription>Настройте уведомления</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              Настройки уведомлений будут доступны в будущих обновлениях
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
