"use client";

import { Shield, Zap, Search, Headphones, Clock, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    id: 1,
    title: "Безопасные сделки",
    description:
      "Все объявления проверяются модераторами. Гарантия безопасности ваших данных.",
    icon: Shield,
    color: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-500",
  },
  {
    id: 2,
    title: "Быстрый поиск",
    description:
      "Мощная система фильтров поможет найти именно то, что вы ищете за минуты.",
    icon: Zap,
    color: "from-yellow-500/10 to-orange-500/10",
    iconColor: "text-yellow-500",
  },
  {
    id: 3,
    title: "Умный поиск",
    description: "ИИ-рекомендации подберут варианты, которые точно вам подойдут.",
    icon: Search,
    color: "from-green-500/10 to-emerald-500/10",
    iconColor: "text-green-500",
  },
  {
    id: 4,
    title: "Поддержка 24/7",
    description: "Наша команда всегда готова помочь вам с любыми вопросами.",
    icon: Headphones,
    color: "from-purple-500/10 to-pink-500/10",
    iconColor: "text-purple-500",
  },
  {
    id: 5,
    title: "Экономия времени",
    description: "Разместите объявление за 5 минут. Начните получать отклики сразу же.",
    icon: Clock,
    color: "from-indigo-500/10 to-blue-500/10",
    iconColor: "text-indigo-500",
  },
  {
    id: 6,
    title: "Проверенные агенты",
    description: "Работайте только с проверенными агентами с высоким рейтингом.",
    icon: Award,
    color: "from-rose-500/10 to-red-500/10",
    iconColor: "text-rose-500",
  },
];

export function FeaturesSection() {
  return (
    <section className='py-12 sm:py-16 md:py-20 bg-background'>
      <div className='container mx-auto px-4'>
        <div className='max-w-2xl mx-auto text-center mb-8 sm:mb-12'>
          <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4'>
            Почему выбирают нас
          </h2>
          <p className='text-muted-foreground text-sm sm:text-base'>
            Мы делаем поиск и продажу недвижимости простым и безопасным
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto'>
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.id}
                className='border-primary/10 bg-card/80 hover:shadow-lg hover:border-primary/30 transition-all hover:-translate-y-1 h-full'
              >
                <CardContent className='p-6'>
                  <div
                    className={`w-12 h-12 mb-4 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center`}
                  >
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} strokeWidth={2} />
                  </div>
                  <h3 className='text-lg sm:text-xl font-semibold text-foreground mb-2'>
                    {feature.title}
                  </h3>
                  <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
