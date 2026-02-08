"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/constants";
import { formatPhoneInput, validateContact, normalizeContact } from "@/lib/contact-utils";
import { cn } from "@/lib/utils";
import { OAuthPopupButton } from "@/components/features";

const INPUT_BASE =
  "h-11 sm:h-12 w-full tracking-wider rounded-xl pr-4 py-3 text-base placeholder:text-muted-foreground transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed border border-input bg-background";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);
  const setError = useAuthStore((state) => state.setError);
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const contactPlaceholder = "+7 (___) __-__-__";

  useEffect(() => {
    setError(null);
  }, [setError]);

  const handleContactChange = (inputValue: string) => {
    // Only allow phone numbers
    const digitsCount = (inputValue.match(/\d/g) || []).length;
    const isPhoneInput = digitsCount > 0 && /^[\d+7\s\-()]*$/.test(inputValue);
    if (isPhoneInput) {
      setContact(formatPhoneInput(inputValue));
    } else {
      setContact(inputValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Only validate phone
    if (!validateContact(contact) || contact.replace(/\D/g, "").length < 10) {
      toast.error("Введите корректный номер телефона");
      return;
    }
    if (!password.trim()) {
      toast.error("Введите пароль");
      return;
    }
    setIsLoading(true);

    try {
      const { contact: normalized } = normalizeContact(contact);
      await login(normalized, password);
      toast.success("Вы успешно вошли в аккаунт", {
        description: "Перенаправление в личный кабинет",
      });
      router.push(ROUTES.dashboard);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Неверный логин или пароль";
      toast.error(errorMessage, { description: "Попробуйте еще раз" });
    } finally {
      setIsLoading(false);
    }
  };

  const oauthBtnClass =
    "w-full h-10 sm:h-11 cursor-pointer rounded-xl flex items-center justify-center gap-2 border border-input bg-background hover:bg-muted/60 transition-colors";

  const GoogleIcon = () => (
    <svg className='w-5 h-5 shrink-0' viewBox='0 0 24 24' aria-hidden='true'>
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
  );

  return (
    <div className='flex items-center justify-center min-h-[80vh] sm:min-h-[90vh] px-3 py-2 sm:px-4 sm:py-6 md:py-12 bg-muted/30 w-full'>
      <Card className='w-full max-w-md border-primary/30 shadow-xl rounded-2xl'>
        <CardHeader className='space-y-1 text-center py-6 px-4 sm:px-6'>
          <CardTitle className='text-lg sm:text-xl md:text-2xl font-bold'>
            Вход в аккаунт
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 sm:space-y-5 px-4 sm:px-6 pb-5 sm:pb-6'>
          <div className='grid grid-cols-3 gap-1.5 sm:gap-2'>
            <Button variant='outline' className={oauthBtnClass} asChild>
              <OAuthPopupButton
                provider='google'
                label='Google'
                icon={<GoogleIcon />}
                onSuccessRedirect={ROUTES.dashboard}
              />
            </Button>
            <Button variant='outline' className={oauthBtnClass} asChild>
              <OAuthPopupButton
                provider='yandex'
                label='Яндекс'
                icon={
                  <Image
                    src='/yandex.png'
                    alt=''
                    width={20}
                    height={20}
                    className='shrink-0'
                  />
                }
                onSuccessRedirect={ROUTES.dashboard}
              />
            </Button>
            <Button variant='outline' className={oauthBtnClass} asChild>
              <OAuthPopupButton
                provider='vk'
                label='VK'
                icon={
                  <Image
                    src='/vk.png'
                    alt=''
                    width={20}
                    height={20}
                    className='shrink-0'
                  />
                }
                onSuccessRedirect={ROUTES.dashboard}
              />
            </Button>
          </div>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <Separator />
            </div>
            <div className='relative flex justify-center'>
              <span className='bg-card px-3 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                Или по номеру телефона
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4 sm:space-y-5' noValidate>
            <div className='space-y-1.5 sm:space-y-2'>
              <Label htmlFor='contact' className='text-sm font-medium text-foreground'>
                Номер телефона
              </Label>
              <div className='relative'>
                <Input
                  id='contact'
                  type='text'
                  inputMode='tel'
                  placeholder={contactPlaceholder}
                  value={contact}
                  onChange={(e) => handleContactChange(e.target.value)}
                  required
                  autoComplete='username'
                  className={cn(INPUT_BASE, "tracking-wider")}
                  aria-describedby={error ? "form-error" : undefined}
                  aria-invalid={!!error}
                />
              </div>
            </div>

            <div className='space-y-1.5 sm:space-y-2'>
              <Label htmlFor='password' className='text-sm font-medium text-foreground'>
                Пароль
              </Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? "text" : "password"}
                  placeholder='Введите пароль'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete='current-password'
                  className={cn(INPUT_BASE, "pr-12")}
                  aria-describedby={error ? "form-error" : undefined}
                  aria-invalid={!!error}
                />
                <Button
                  type='button'
                  variant='clear'
                  size='icon'
                  className='absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground min-w-0'
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className='h-5 w-5' />
                  ) : (
                    <Eye className='h-5 w-5' />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div
                id='form-error'
                className='p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20'
                role='alert'
                aria-live='polite'
              >
                {error}
              </div>
            )}

            <Button
              type='submit'
              className='w-full h-11 sm:h-12 rounded-xl text-base font-medium btn-caucasus'
              disabled={isLoading}
              aria-label={isLoading ? "Выполняется вход" : "Войти в аккаунт"}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' aria-hidden />
                  Вход...
                </>
              ) : (
                "Войти"
              )}
            </Button>
          </form>

          <p className='text-center text-xs sm:text-sm text-muted-foreground'>
            Нет аккаунта?{" "}
            <Link
              href={ROUTES.register}
              className='text-primary hover:underline font-medium'
            >
              Зарегистрироваться
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
