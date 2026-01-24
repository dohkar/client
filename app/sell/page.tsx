"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import type { Property } from "@/types/property";
import { PropertyForm } from "@/components/features/property-form";

const FEATURES = [
  "Размещение объявления за 5 минут",
  "Загрузка до 20 фотографий",
  "Статистика просмотров",
  "Премиум-продвижение",
  "Безопасная сделка",
  "Поддержка 24/7",
] as const;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Разместить объявление о недвижимости",
  description:
    "Разместите объявление о недвижимости на платформе Dohkar. Быстро, удобно, эффективно.",
  url: "https://dohkar.ru/sell",
  mainEntity: {
    "@type": "Service",
    name: "Размещение объявлений о недвижимости",
    provider: {
      "@type": "Organization",
      name: "Dohkar",
    },
  },
};

function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Заголовок */}
          <div className="space-y-2">
            <Skeleton className="h-8 sm:h-9 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>

          {/* Основная информация - Card */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <Skeleton className="h-6 w-48 flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-40" />
              </Skeleton>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Заголовок */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-11 w-full" />
              </div>
              {/* Цена */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-11 w-full" />
              </div>
              {/* Адрес */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-11 w-full" />
              </div>
              {/* Регион и Тип */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-11 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-11 w-full" />
                </div>
              </div>
              {/* Комнаты и Площадь */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-11 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-11 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Описание - Card */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <Skeleton className="h-6 w-32 flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-24" />
              </Skeleton>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-32 w-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Изображения - Card */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40 flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-32" />
                </Skeleton>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Skeleton className="h-48 w-full rounded-xl" />
            </CardContent>
          </Card>

          {/* Кнопка отправки */}
          <div className="flex justify-end pt-4">
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  feature,
  index,
}: {
  feature: string;
  index: number;
}) {
  return (
    <div
      className="group flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-md focus-within:ring-2 focus-within:ring-primary/20 focus-within:outline-none"
      style={{
        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      <CheckCircle2
        className="w-5 h-5 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300"
        aria-hidden="true"
      />
      <span className="text-sm sm:text-base text-foreground font-medium leading-relaxed">
        {feature}
      </span>
    </div>
  );
}

function LandingSection() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 sm:py-10 md:py-14">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          <div
            className="text-center space-y-3 sm:space-y-4"
            style={{
              animation: "fadeIn 0.6s ease-out",
            }}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Продайте недвижимость быстро
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2 leading-relaxed">
              Разместите объявление на самой популярной платформе недвижимости в
              Ингушетии и Чечне
            </p>
          </div>
          <Card
            className="border-primary/20 shadow-lg bg-background/80 backdrop-blur-md transition-all duration-300 hover:shadow-xl"
            style={{
              animation: "fadeIn 0.6s ease-out 0.2s both",
            }}
          >
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg sm:text-xl md:text-2xl">
                Почему выбирают нас?
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm md:text-base">
                Всё необходимое для успешной продажи
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {FEATURES.map((feature, index) => (
                  <FeatureCard key={feature} feature={feature} index={index} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card
            className="relative overflow-hidden border-0 shadow-2xl text-white"
            style={{
              animation: "fadeIn 0.6s ease-out 0.4s both",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary opacity-90" />
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
            <CardContent className="relative p-6 sm:p-8 text-center space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                Готовы начать?
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-white/95 leading-relaxed max-w-xl mx-auto">
                Зарегистрируйтесь и разместите первое объявление бесплатно
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-primary hover:bg-white/95 gap-2 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 min-h-[48px] w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                  aria-label="Перейти к регистрации для размещения объявления"
                >
                  <Link href={ROUTES.register} passHref>
                    Разместить объявление
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-primary/90 text-primary hover:bg-primary/10 hover:border-primary backdrop-blur-sm min-h-[48px] w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-primary transition-all duration-300 hover:scale-105"
                  aria-label="Войти в существующий аккаунт"
                >
                  <Link href={ROUTES.login} passHref>
                    Уже есть аккаунт
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <div
            className="mt-6 sm:mt-8 md:mt-12 text-center text-xs sm:text-sm text-muted-foreground px-2 space-y-2"
            style={{
              animation: "fadeIn 0.6s ease-out 0.6s both",
            }}
          >
            <p className="leading-relaxed">
              Первое объявление — бесплатно. Премиум-продвижение — от 500₽/месяц.
            </p>
            <Link
              href={ROUTES.premium}
              className="text-primary hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded-sm transition-colors"
              aria-label="Узнать больше о тарифах премиум-продвижения"
            >
              Узнать больше о тарифах →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormErrorFallback() {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">
          Ошибка загрузки формы
        </CardTitle>
        <CardDescription>
          Произошла ошибка при загрузке формы. Пожалуйста, обновите страницу.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => window.location.reload()}
          variant="default"
          aria-label="Обновить страницу"
        >
          Обновить страницу
        </Button>
      </CardContent>
    </Card>
  );
}

function FormSection() {
  const router = useRouter();

  const handleSuccess = (property: Property) => {
    toast.success("Объявление успешно создано!", {
      description: "Перенаправляем на страницу объявления...",
      duration: 3000,
    });
    router.push(`/property/${property.id}`);
  };

  return (
    <div
      className="min-h-screen bg-muted/30"
      style={{
        animation: "fadeIn 0.5s ease-out",
      }}
    >
      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <a
            href="#property-form"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
          >
            Перейти к форме
          </a>
          <div className="mb-6 sm:mb-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Разместить объявление
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Заполните форму ниже, чтобы разместить ваше объявление
            </p>
          </div>
          <div id="property-form">
            <ErrorBoundary fallback={FormErrorFallback}>
              <PropertyForm onSuccess={handleSuccess} />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SellPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  if (!isInitialized) {
    return <AuthSkeleton />;
  }

  if (isAuthenticated) {
    return <FormSection />;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingSection />
    </>
  );
}
