"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants";
import { FeatureCard } from "./feature-card";

const FEATURES = [
  "Размещение объявления за 5 минут",
  "Загрузка до 20 фотографий",
  "Статистика просмотров",
  "Премиум-продвижение",
  "Безопасная сделка",
  "Поддержка 24/7",
] as const;

export function SellLandingSection() {
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
