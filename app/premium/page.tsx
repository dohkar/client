"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/Container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Star,
  TrendingUp,
  Eye,
  Zap,
  Shield,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/stores";
import { ROUTES } from "@/constants";
import {
  subscriptionsService,
  type SubscriptionPlan,
} from "@/services/subscriptions.service";
import { toast } from "sonner";

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
    description:
      "Ваше объявление получает приоритет и больше внимания от покупателей",
  },
];

function formatPrice(rub: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rub);
}

function periodLabel(plan: SubscriptionPlan): string {
  if (plan.interval === "YEAR") {
    return plan.intervalCount === 1 ? "в год" : `на ${plan.intervalCount} лет`;
  }
  return plan.intervalCount === 1 ? "в месяц" : `на ${plan.intervalCount} мес.`;
}

function FeaturesSection() {
  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">
          Преимущества премиум размещения
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-3">
              <div className="shrink-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
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
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [creatingCode, setCreatingCode] = useState<string | null>(null);

  const { data: plans = [], isLoading, error } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: () => subscriptionsService.getPlans(),
    staleTime: 5 * 60 * 1000,
  });

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      router.push(ROUTES.login);
      return;
    }
    try {
      setCreatingCode(plan.code);
      const response = await subscriptionsService.createPayment(plan.code);
      if (response.confirmationUrl) {
        window.location.href = response.confirmationUrl;
        return;
      }
      toast.error("Не удалось получить ссылку на оплату");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Ошибка при создании платежа"
      );
    } finally {
      setCreatingCode(null);
    }
  };

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <p className="text-destructive text-sm">
            Не удалось загрузить тарифы. Обновите страницу.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {/* Базовый (бесплатный) — статическая карточка */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Базовый</CardTitle>
          <div className="mt-2">
            <span className="text-3xl sm:text-4xl font-bold text-foreground">
              0₽
            </span>
            <span className="text-sm sm:text-base text-muted-foreground ml-2">
              / навсегда
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {[
              "Размещение объявления",
              "До 20 фотографий",
              "Базовая статистика",
              "Стандартное размещение",
            ].map((feat) => (
              <li key={feat} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-foreground">
                  {feat}
                </span>
              </li>
            ))}
          </ul>
          <Button className="w-full min-h-[44px]" variant="outline" asChild>
            <Link href={ROUTES.register}>
              Начать бесплатно
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Платные тарифы из API */}
      {isLoading ? (
        <Card className="border-primary/20">
          <CardContent className="flex items-center justify-center min-h-[280px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : (
        plans.map((plan, index) => {
          const isPopular = index === 0 && plans.length > 0;
          const isCreating = creatingCode === plan.code;
          return (
            <Card
              key={plan.id}
              className={`shadow-lg transition-shadow ${
                isPopular
                  ? "border-primary border-2 relative"
                  : "border-primary/20"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow">
                    Популярный
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">
                  {plan.name}
                </CardTitle>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.description}
                  </p>
                )}
                <div className="mt-2">
                  <span className="text-3xl sm:text-4xl font-bold text-foreground">
                    {formatPrice(plan.priceRub)}₽
                  </span>
                  <span className="text-sm sm:text-base text-muted-foreground ml-2">
                    / {periodLabel(plan)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    "Все возможности базового",
                    "Приоритетное размещение",
                    "Увеличенное количество просмотров",
                    "Выделение в списке",
                    "Быстрая публикация",
                    "Проверка документов",
                  ].map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-foreground">
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full min-h-[44px]"
                  variant="default"
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCreating}
                  type="button"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Создание платежа...
                    </>
                  ) : (
                    <>
                      Выбрать тариф
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

function HowItWorksSection() {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Как это работает?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {HOW_IT_WORKS.map(({ number, title, description }) => (
            <div className="flex gap-4" key={number}>
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">
                  {number}
                </span>
              </div>
              <div>
                <p className="text-sm sm:text-base font-semibold text-foreground mb-1">
                  {title}
                </p>
                <p className="text-sm sm:text-base text-muted-foreground">
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
    <Card className="border-primary/20 bg-muted/30">
      <CardContent className="pt-6">
        <p className="text-sm sm:text-base text-center text-muted-foreground">
          Есть вопросы? Свяжитесь с нами:&nbsp;
          <a
            href="mailto:support@dohkar.ru"
            className="text-primary hover:underline font-medium"
          >
            support@dohkar.ru
          </a>
        </p>
      </CardContent>
    </Card>
  );
}

export default function PremiumPage() {
  const searchParams = useSearchParams();
  const paymentState = searchParams.get("payment");
  const paymentId = searchParams.get("paymentId");

  useEffect(() => {
    if (paymentState !== "pending" || !paymentId) return;

    let attempts = 0;
    const maxAttempts = 5;
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const status = await subscriptionsService.getPaymentStatus(paymentId);
        if (status.status === "SUCCEEDED") {
          toast.success("Оплата подтверждена. Премиум активирован.");
          clearInterval(timer);
          return;
        }
      } catch {
        // Polling fail silently; webhook remains source of truth.
      }

      if (attempts >= maxAttempts) {
        clearInterval(timer);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [paymentState, paymentId]);

  return (
    <Container size="lg" className="py-6 sm:py-8 md:py-12">
      <div className="space-y-6 sm:space-y-8">
        <div className="text-center space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Премиум размещение
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
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
