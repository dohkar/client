import { Container } from "@/components/layout/Container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, Eye, Zap, Shield, CheckCircle2 } from "lucide-react";

const FEATURES = [
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

const PLANS = [
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
    buttonText: "Начать бесплатно",
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
    buttonText: "Выбрать премиум",
  },
];

const HOW_IT_WORKS = [
  {
    number: 1,
    title: "Разместите объявление",
    description: "Создайте объявление о вашей недвижимости на нашем сайте",
  },
  {
    number: 2,
    title: "Выберите премиум тариф",
    description: "Активируйте премиум размещение для вашего объявления",
  },
  {
    number: 3,
    title: "Получайте больше просмотров",
    description: "Ваше объявление получает приоритет и больше внимания от покупателей",
  },
];

function FeaturesSection() {
  return (
    <Card className='shadow-lg border-primary/20'>
      <CardHeader>
        <CardTitle className='text-xl sm:text-2xl'>
          Преимущества премиум размещения
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
          {FEATURES.map(({ icon: Icon, title, description }, _idx) => (
            <div key={title} className='flex gap-3'>
              <div className='shrink-0'>
                <div className='w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center'>
                  <Icon className='w-5 h-5 text-primary' />
                </div>
              </div>
              <div>
                <h3 className='text-sm sm:text-base font-semibold text-foreground mb-1'>
                  {title}
                </h3>
                <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PlansSection() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8'>
      {PLANS.map((plan, _idx) => (
        <Card
          key={plan.name}
          className={`shadow-lg transition-shadow ${
            plan.popular ? "border-primary border-2 relative" : "border-primary/20"
          }`}
        >
          {plan.popular && (
            <div className='absolute -top-3 left-1/2 -translate-x-1/2 z-10'>
              <span className='bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow'>
                Популярный
              </span>
            </div>
          )}
          <CardHeader>
            <CardTitle className='text-xl sm:text-2xl'>{plan.name}</CardTitle>
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
              {plan.features.map((feat, _idx) => (
                <li key={feat} className='flex items-start gap-2'>
                  <CheckCircle2 className='w-5 h-5 text-primary shrink-0 mt-0.5' />
                  <span className='text-sm sm:text-base text-foreground'>{feat}</span>
                </li>
              ))}
            </ul>
            <Button
              className='w-full min-h-[44px]'
              variant={plan.popular ? "default" : "outline"}
              asChild={false}
            >
              {plan.buttonText}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function HowItWorksSection() {
  return (
    <Card className='border-primary/20'>
      <CardHeader>
        <CardTitle className='text-lg sm:text-xl'>Как это работает?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {HOW_IT_WORKS.map(({ number, title, description }) => (
            <div className='flex gap-4' key={number}>
              <div className='shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                <span className='text-primary font-semibold text-sm'>{number}</span>
              </div>
              <div>
                <p className='text-sm sm:text-base font-semibold text-foreground mb-1'>
                  {title}
                </p>
                <p className='text-sm sm:text-base text-muted-foreground'>
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ContactSection() {
  return (
    <Card className='border-primary/20 bg-muted/30'>
      <CardContent className='pt-6'>
        <p className='text-sm sm:text-base text-center text-muted-foreground'>
          Есть вопросы? Свяжитесь с нами:&nbsp;
          <a
            href='mailto:support@dohkar.ru'
            className='text-primary hover:underline font-medium'
          >
            support@dohkar.ru
          </a>
        </p>
      </CardContent>
    </Card>
  );
}

export default function PremiumPage() {
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
        <FeaturesSection />
        <PlansSection />
        <HowItWorksSection />
        <ContactSection />
      </div>
    </Container>
  );
}
