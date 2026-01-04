"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { PropertyForm } from "@/components/features/property-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants";

const features = [
  "Размещение объявления за 5 минут",
  "Загрузка до 20 фотографий",
  "Статистика просмотров",
  "Премиум-продвижение",
  "Безопасная сделка",
  "Поддержка 24/7",
];

export default function SellPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setShowForm(true);
    }
  }, [isAuthenticated]);

  if (showForm && isAuthenticated) {
    return (
      <div className='min-h-screen bg-muted/30'>
        <div className='container mx-auto px-4 py-6 sm:py-8 md:py-12'>
          <div className='max-w-4xl mx-auto'>
            <div className='mb-6 sm:mb-8'>
              <h1 className='text-2xl sm:text-3xl font-bold mb-2'>
                Разместить объявление
              </h1>
              <p className='text-sm sm:text-base text-muted-foreground'>
                Заполните форму ниже, чтобы разместить ваше объявление
              </p>
            </div>
            <PropertyForm
              onSuccess={(property) => {
                router.push(`/property/${property.id}`);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-muted/30'>
      <div className='container mx-auto px-4 py-8 sm:py-12 md:py-16'>
        <div className='max-w-4xl mx-auto'>
          {/* Hero */}
          <div className='text-center mb-8 sm:mb-12'>
            <h1 className='text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4'>
              Продайте недвижимость быстро
            </h1>
            <p className='text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2'>
              Разместите объявление на самой популярной платформе недвижимости в
              Ингушетии и Чечне
            </p>
          </div>

          {/* Features */}
          <Card className='mb-6 sm:mb-8 border-primary/20 shadow-sm'>
            <CardHeader>
              <CardTitle className='text-xl sm:text-2xl'>
                Почему выбирают нас?
              </CardTitle>
              <CardDescription className='text-sm sm:text-base'>
                Всё необходимое для успешной продажи
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className='flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors'
                  >
                    <CheckCircle2 className='w-5 h-5 text-primary flex-shrink-0 mt-0.5' />
                    <span className='text-sm sm:text-base text-foreground'>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className='gradient-mountains text-white border-0 shadow-xl'>
            <CardContent className='p-6 sm:p-8 text-center'>
              <h2 className='text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4'>
                Готовы начать?
              </h2>
              <p className='text-white/90 mb-6 text-base sm:text-lg'>
                Зарегистрируйтесь и разместите первое объявление бесплатно
              </p>
              <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center'>
                <Link href={ROUTES.register}>
                  <Button
                    size='lg'
                    className='bg-white text-primary hover:bg-white/90 gap-2 font-semibold shadow-lg hover:shadow-xl transition-all min-h-[48px] w-full sm:w-auto'
                  >
                    Разместить объявление
                    <ArrowRight className='w-4 h-4' />
                  </Button>
                </Link>
                <Link href={ROUTES.login}>
                  <Button
                    size='lg'
                    variant='outline'
                    className='border-2 border-white text-primary hover:bg-white/20 backdrop-blur-sm min-h-[48px] w-full sm:w-auto'
                  >
                    Уже есть аккаунт
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Info */}
          <div className='mt-8 sm:mt-12 text-center text-xs sm:text-sm text-muted-foreground px-2'>
            <p>
              Первое объявление — бесплатно. Премиум-продвижение — от
              500₽/месяц.
            </p>
            <Link
              href={ROUTES.premium}
              className='text-primary hover:underline font-medium'
            >
              Узнать больше о тарифах →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
