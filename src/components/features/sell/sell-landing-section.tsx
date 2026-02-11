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
    <section className='min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/10 flex flex-col justify-center py-14 px-2'>
      <div className='container max-w-3xl mx-auto space-y-10'>
        {/* Hero */}
        <div
          className='text-center space-y-4'
          style={{
            animation: "fadeIn 0.8s cubic-bezier(.19,1,.22,1)",
          }}
        >
          <h1 className='text-3xl sm:text-4xl md:text-5xl font-bold text-foreground drop-shadow-lg tracking-tight'>
            Продайте недвижимость быстро
          </h1>
          <p className='text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed backdrop-blur rounded-lg px-2 py-1'>
            Разместите объявление на самой популярной платформе недвижимости в{" "}
            <span className='font-semibold text-primary'>Ингушетии</span> и{" "}
            <span className='font-semibold text-accent'>Чечне</span>
          </p>
        </div>

        {/* Why choose us */}
        <Card
          className='mx-auto border-0 shadow-xl bg-background/80 backdrop-blur-lg transition hover:shadow-2xl'
          style={{
            animation: "fadeIn 0.8s cubic-bezier(.19,1,.22,1) 0.2s both",
          }}
        >
          <CardHeader className='pb-2 text-center'>
            <CardTitle className='text-xl sm:text-2xl md:text-3xl font-bold text-primary'>
              Почему выбирают нас?
            </CardTitle>
            <CardDescription className='text-base sm:text-lg md:text-xl text-muted-foreground'>
              Всё необходимое для успешной продажи!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className='grid sm:grid-cols-2 gap-4 pt-2'>
              {FEATURES.map((feature, index) => (
                <li key={feature}>
                  <FeatureCard feature={feature} index={index} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Call to Action Gradient Card */}
        <Card
          className='relative overflow-hidden border-0 shadow-2xl rounded-2xl'
          style={{
            animation: "fadeIn 0.8s cubic-bezier(.19,1,.22,1) 0.4s both",
          }}
        >
          <div className='absolute inset-0 z-0 bg-gradient-to-tr from-primary via-accent to-secondary opacity-95' />
          <div className='absolute inset-0 z-0 bg-black/20 backdrop-blur-md' />
          <CardContent className='relative z-10 p-8 sm:p-10 flex flex-col items-center gap-6 text-center'>
            <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg'>
              Готовы начать?
            </h2>
            <p className='text-base sm:text-lg md:text-xl text-white/90 font-light leading-relaxed max-w-xl mx-auto'>
              Зарегистрируйтесь и разместите первое объявление бесплатно.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 w-full sm:justify-center sm:items-center'>
              <Button
                asChild
                size='lg'
                className='bg-white/90 text-primary hover:bg-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[48px] w-full sm:w-auto px-8'
                aria-label='Перейти к регистрации для размещения объявления'
              >
                <Link href={ROUTES.register}>
                  Разместить объявление
                  <ArrowRight className='w-4 h-4 ml-2' aria-hidden='true' />
                </Link>
              </Button>
              <Button
                asChild
                size='lg'
                variant='outline'
                className='border-2 border-white/80 bg-white/10 text-white hover:bg-white/20 hover:text-primary transition-all min-h-[48px] font-semibold w-full sm:w-auto px-8'
                aria-label='Войти в существующий аккаунт'
              >
                <Link href={ROUTES.login}>Уже есть аккаунт</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info & Premium */}
        <div
          className='mt-8 text-center text-sm sm:text-base text-muted-foreground/90 max-w-xl mx-auto px-2 space-y-3'
          style={{
            animation: "fadeIn 0.8s cubic-bezier(.19,1,.22,1) 0.6s both",
          }}
        >
          <p className='leading-relaxed font-medium'>
            <span className='bg-primary/20 rounded px-2 mr-2'>
              Первое объявление —{" "}
              <span className='text-primary font-bold'>бесплатно</span>.
            </span>
            <br />
            <span className='bg-accent/20 rounded px-2'>
              Премиум-продвижение - от{" "}
              <span className='font-bold text-accent'> 500₽/мес</span>.
            </span>
          </p>
          <Link
            href={ROUTES.premium}
            className='inline-block mt-1 text-primary/90 hover:text-primary font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded transition-colors'
            aria-label='Узнать больше о тарифах премиум-продвижения'
          >
            Подробнее о премиум-продвижении →
          </Link>
        </div>
      </div>
    </section>
  );
}
