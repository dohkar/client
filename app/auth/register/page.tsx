"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { ROUTES } from "@/constants";

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const error = useAuthStore((state) => state.error);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (password !== confirmPassword) {
      setFormError("Пароли не совпадают");
      return;
    }

    if (password.length < 6) {
      setFormError("Пароль должен быть не менее 6 символов");
      return;
    }

    setIsLoading(true);

    try {
      await register({ name, email, password, phone: phone || undefined });
      toast.success("Регистрация успешна");
      // Очищаем форму
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
      setFormError("");
      // Перенаправляем на dashboard
      router.push(ROUTES.dashboard);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Ошибка регистрации";
      // Показываем ошибку в toast и в форме
      toast.error(errorMessage);
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: "google" | "yandex" | "vk") => {
    const url = authService.getOAuthUrl(provider);
    window.location.href = url;
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12'>
      <Card className='w-full max-w-md border-primary/20'>
        <CardHeader className='space-y-1 text-center'>
          {/* <div className='mx-auto w-12 h-12 gradient-mountains rounded-lg flex items-center justify-center mb-4'>
            <span className='text-white font-bold text-xl'>Д</span>
          </div> */}
          <CardTitle className='text-2xl font-bold'>Регистрация</CardTitle>
          {/* <CardDescription>
            Создайте аккаунт чтобы размещать объявления
          </CardDescription> */}
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='grid grid-cols-3 gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleOAuthLogin("google")}
                className='w-full min-h-[44px] flex items-center justify-center'
                aria-label='Зарегистрироваться через Google'
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
                className='w-full min-h-[44px] flex items-center justify-center'
                aria-label='Зарегистрироваться через Yandex'
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
                className='w-full min-h-[44px] flex items-center justify-center'
                aria-label='Зарегистрироваться через VK'
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

          <form onSubmit={handleSubmit} className='space-y-4 mt-6'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Имя</Label>
              <Input
                id='name'
                type='text'
                placeholder='Ваше имя'
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='your@email.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='phone'>Телефон (необязательно)</Label>
              <Input
                id='phone'
                type='tel'
                placeholder='+7 (928) 000-00-00'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                minLength={6}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Подтвердите пароль</Label>
              <Input
                id='confirmPassword'
                type='password'
                placeholder='••••••••'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {(formError || error) && (
              <div className='p-3 text-sm text-destructive bg-destructive/10 rounded-md'>
                {formError || error}
              </div>
            )}

            <Button
              type='submit'
              className='w-full btn-caucasus min-h-[44px]'
              disabled={isLoading}
            >
              {isLoading ? "Регистрация..." : "Зарегистрироваться"}
            </Button>
          </form>

          <div className='mt-6 text-center text-sm text-muted-foreground'>
            Уже есть аккаунт?{" "}
            <Link
              href={ROUTES.login}
              className='text-primary hover:underline font-medium'
            >
              Войти
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
