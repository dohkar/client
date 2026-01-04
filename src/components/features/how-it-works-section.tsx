"use client";

import { Search, FileText, Handshake, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    id: 1,
    title: "Найдите или разместите",
    description: "Используйте удобный поиск или разместите свое объявление за пару минут",
    icon: Search,
    badge: "Шаг 1",
  },
  {
    id: 2,
    title: "Просмотрите детали",
    description: "Изучите фотографии, описание и контакты. Все необходимое в одном месте",
    icon: FileText,
    badge: "Шаг 2",
  },
  {
    id: 3,
    title: "Свяжитесь напрямую",
    description:
      "Свяжитесь с продавцом или покупателем. Общайтесь безопасно через платформу",
    icon: Handshake,
    badge: "Шаг 3",
  },
  {
    id: 4,
    title: "Совершите сделку",
    description: "Завершите сделку с уверенностью. Мы поможем на каждом этапе",
    icon: Home,
    badge: "Готово!",
  },
];

export function HowItWorksSection() {
  return (
    <section className='py-12 sm:py-16 md:py-20 bg-muted/40'>
      <div className='container mx-auto px-4'>
        <div className='max-w-2xl mx-auto text-center mb-8 sm:mb-12'>
          <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4'>
            Как это работает
          </h2>
          {/* <p className='text-muted-foreground text-sm sm:text-base'>
              Простой процесс в несколько шагов
            </p> */}
        </div>

        <div className='max-w-5xl mx-auto'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === steps.length - 1;
              return (
                <div key={step.id} className='relative'>
                  <Card className='border-primary/10 bg-card/80 hover:shadow-lg hover:border-primary/30 transition-all hover:-translate-y-1 h-full'>
                    <CardContent className='p-6 text-center'>
                      <div className='relative mb-4'>
                        <div className='w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-3'>
                          <Icon className='w-8 h-8 text-primary' strokeWidth={2} />
                        </div>
                        <Badge
                          variant='secondary'
                          className='absolute -top-2 -right-2 bg-primary text-primary-foreground'
                        >
                          {step.badge}
                        </Badge>
                      </div>
                      <h3 className='text-lg sm:text-xl font-semibold text-foreground mb-2'>
                        {step.title}
                      </h3>
                      <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                  {!isLast && (
                    <div className='hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10'>
                      <div className='w-6 h-0.5 bg-primary/30' />
                      <div className='absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-primary/30 border-t-2 border-t-transparent border-b-2 border-b-transparent' />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
