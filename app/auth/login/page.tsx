"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/constants";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success("Вы успешно вошли в аккаунт", {
        description: "Перенаправление в личный кабинет",
      });
      router.push(ROUTES.dashboard);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ошибка входа";
      toast.error(errorMessage, {
        description: "Попробуйте еще раз",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: "google" | "yandex" | "vk") => {
    const url = authService.getOAuthUrl(provider);
    window.location.href = url;
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-muted/30 px-4 py-6 sm:py-12'>
      <Card className='w-full max-w-md border-primary/20'>
        <CardHeader className='space-y-1 text-center'>
          <CardTitle className='text-xl sm:text-2xl font-bold'>Вход в аккаунт</CardTitle>
          {/* <CardDescription className='text-sm sm:text-base'>
            Войдите чтобы управлять своими объявлениями
          </CardDescription> */}
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='grid grid-cols-3 gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleOAuthLogin("google")}
                className='w-full min-h-[44px] flex items-center justify-center sm:justify-start'
                aria-label='Войти через Google'
              >
                <svg
                  className='w-5 h-5 sm:mr-2 shrink-0'
                  viewBox='0 0 24 24'
                  aria-hidden='true'
                >
                  <path
                    fill='#4285F4'
                    d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                  />
                  <path
                    fill='#34A853'
                    d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                  />
                  <path
                    fill='#FBBC05'
                    d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                  />
                  <path
                    fill='#EA4335'
                    d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                  />
                </svg>
                <span className='hidden sm:inline'>Google</span>
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleOAuthLogin("yandex")}
                className='w-full min-h-[44px] flex items-center justify-center sm:justify-start'
                aria-label='Войти через Yandex'
              >
                <Image
                  src='/yandex.png'
                  alt='Yandex'
                  width={20}
                  height={20}
                  className='sm:mr-2 shrink-0'
                />
                <span className='hidden sm:inline'>Яндекс</span>
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleOAuthLogin("vk")}
                className='w-full min-h-[44px] flex items-center justify-center sm:justify-start'
                aria-label='Войти через VK'
              >
                <Image
                  src='/vk.png'
                  alt='VK'
                  width={20}
                  height={20}
                  className='sm:mr-2 shrink-0'
                />
                <span className='hidden sm:inline'>VK</span>
              </Button>
            </div>
          </div>

          <div className='mt-6 space-y-4'>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <Separator />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-card px-2 text-muted-foreground'>
                  Или через email
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4 mt-6' noValidate>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='your@email.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete='email'
                aria-describedby='email-error'
                aria-invalid={!!error}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Пароль</Label>
              <Input
                id='password'
                type='password'
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete='current-password'
                aria-describedby='password-error'
                aria-invalid={!!error}
              />
            </div>

            <div className='flex items-center justify-between text-sm'>
              <Link href={ROUTES.forgotPassword} className='text-primary hover:underline'>
                Забыли пароль?
              </Link>
            </div>

            {error && (
              <div
                id='form-error'
                className='p-3 text-sm text-destructive bg-destructive/10 rounded-md'
                role='alert'
                aria-live='polite'
              >
                {error}
              </div>
            )}

            <Button
              type='submit'
              className='w-full btn-caucasus min-h-[44px]'
              disabled={isLoading}
              aria-label={isLoading ? "Выполняется вход" : "Войти в аккаунт"}
            >
              {isLoading ? "Вход..." : "Войти"}
            </Button>
          </form>

          <div className='mt-6 text-center text-sm text-muted-foreground'>
            Нет аккаунта?{" "}
            <Link
              href={ROUTES.register}
              className='text-primary hover:underline font-medium'
            >
              Зарегистрироваться
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
