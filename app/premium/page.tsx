import { Container } from "@/components/layout/Container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, Eye, Zap, Shield, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PremiumPage() {
  const features = [
    {
      icon: TrendingUp,
      title: "Приоритетное размещение",
      description: "Ваше объявление будет показываться в топе результатов поиска",
    },
    {
      icon: Eye,
      title: "Увеличенное количество просмотров",
      description: "До 5 раз больше просмотров по сравнению с обычными объявлениями",
    },
    {
      icon: Star,
      title: "Выделение в списке",
      description: "Ваше объявление будет выделено специальным значком премиум",
    },
    {
      icon: Zap,
      title: "Быстрая публикация",
      description: "Мгновенная модерация и публикация объявления",
    },
    {
      icon: Shield,
      title: "Проверка документов",
      description: "Бесплатная проверка документов на недвижимость",
    },
  ];

  const plans = [
    {
      name: "Базовый",
      price: "0₽",
      period: "навсегда",
      features: [
        "Размещение объявления",
        "До 20 фотографий",
        "Базовая статистика",
        "Стандартное размещение",
      ],
      popular: false,
    },
    {
      name: "Премиум",
      price: "500₽",
      period: "в месяц",
      features: [
        "Все возможности базового",
        "Приоритетное размещение",
        "Увеличенное количество просмотров",
        "Выделение в списке",
        "Быстрая публикация",
        "Проверка документов",
      ],
      popular: true,
    },
  ];

  return (
    <Container size='lg' className='py-6 sm:py-8 md:py-12'>
      <div className='space-y-6 sm:space-y-8'>
        <div className='text-center space-y-3 sm:space-y-4'>
          <h1 className='text-3xl sm:text-4xl font-bold text-foreground'>
            Премиум размещение
          </h1>
          <p className='text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2'>
            Выделитесь среди конкурентов и получите больше просмотров
          </p>
        </div>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Преимущества премиум размещения</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className='flex gap-3'>
                    <div className='flex-shrink-0'>
                      <div className='w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center'>
                        <Icon className='w-5 h-5 text-primary' />
                      </div>
                    </div>
                    <div>
                      <h3 className='text-sm sm:text-base font-semibold text-foreground mb-1'>
                        {feature.title}
                      </h3>
                      <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8'>
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`shadow-lg transition-shadow ${
                plan.popular
                  ? "border-primary border-2 relative"
                  : "border-primary/20"
              }`}
            >
              {plan.popular && (
                <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
                  <span className='bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full'>
                    Популярный
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
                <div className='mt-2'>
                  <span className='text-3xl sm:text-4xl font-bold text-foreground'>
                    {plan.price}
                  </span>
                  <span className='text-sm sm:text-base text-muted-foreground ml-2'>
                    / {plan.period}
                  </span>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                <ul className='space-y-3'>
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className='flex items-start gap-2'>
                      <CheckCircle2 className='w-5 h-5 text-primary flex-shrink-0 mt-0.5' />
                      <span className='text-sm sm:text-base text-foreground'>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className='w-full min-h-[44px]'
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href={plan.popular ? "/sell" : "/auth/register"}>
                    {plan.popular ? "Выбрать премиум" : "Начать бесплатно"}
                    <ArrowRight className='w-4 h-4 ml-2' />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Как это работает?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex gap-4'>
                <div className='flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                  <span className='text-primary font-semibold text-sm'>1</span>
                </div>
                <div>
                  <p className='text-sm sm:text-base font-semibold text-foreground mb-1'>
                    Разместите объявление
                  </p>
                  <p className='text-sm sm:text-base text-muted-foreground'>
                    Создайте объявление о вашей недвижимости на нашем сайте
                  </p>
                </div>
              </div>
              <div className='flex gap-4'>
                <div className='flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                  <span className='text-primary font-semibold text-sm'>2</span>
                </div>
                <div>
                  <p className='text-sm sm:text-base font-semibold text-foreground mb-1'>
                    Выберите премиум тариф
                  </p>
                  <p className='text-sm sm:text-base text-muted-foreground'>
                    Активируйте премиум размещение для вашего объявления
                  </p>
                </div>
              </div>
              <div className='flex gap-4'>
                <div className='flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                  <span className='text-primary font-semibold text-sm'>3</span>
                </div>
                <div>
                  <p className='text-sm sm:text-base font-semibold text-foreground mb-1'>
                    Получайте больше просмотров
                  </p>
                  <p className='text-sm sm:text-base text-muted-foreground'>
                    Ваше объявление получает приоритет и больше внимания от покупателей
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-muted/30">
          <CardContent className='pt-6'>
            <p className='text-sm sm:text-base text-center text-muted-foreground'>
              Есть вопросы? Свяжитесь с нами:{" "}
              <a href='mailto:support@dohkar.ru' className='text-primary hover:underline font-medium'>
                support@dohkar.ru
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
