"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/error-boundary";
import type { Property } from "@/types/property";
import { PropertyForm } from "@/components/features/property-form";
import { usePropertyLimits } from "@/hooks/use-properties";
import { ROUTES } from "@/constants";
import { toast } from "sonner";
import { Megaphone, AlertCircle } from "lucide-react";

function FormErrorFallback() {
  return (
    <Card className='border-destructive/50 bg-destructive/5'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-destructive'>
          <AlertCircle className='h-5 w-5' />
          Ошибка загрузки формы
        </CardTitle>
        <CardDescription>
          Не удалось загрузить форму. Обновите страницу или попробуйте позже.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => window.location.reload()} aria-label='Обновить страницу'>
          Обновить страницу
        </Button>
      </CardContent>
    </Card>
  );
}

export function SellFormSection() {
  const router = useRouter();
  const { data: limits } = usePropertyLimits();

  const handleSuccess = (property: Property) => {
    toast.success("Объявление создано", {
      description: "Переход на страницу объявления…",
      duration: 3000,
    });
    router.push(ROUTES.property(property.id, property.slug));
  };

  return (
    <div className='min-h-screen bg-muted/20'>
      <div className='container mx-auto px-4 py-6 md:py-10'>
        <div className='max-w-4xl mx-auto'>
          <a
            href='#property-form'
            className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:ring-2 focus:ring-ring'
          >
            Перейти к форме
          </a>

          <header className='mb-8'>
            <div className='flex items-start gap-3'>
              <div className='rounded-lg bg-primary/10 p-2.5'>
                <Megaphone className='h-6 w-6 text-primary' aria-hidden />
              </div>
              <div className='min-w-0 flex-1'>
                <h1 className='text-2xl font-bold tracking-tight text-foreground md:text-3xl'>
                  Разместить объявление
                </h1>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Заполните все разделы формы. Обязательные поля отмечены звёздочкой.
                </p>
                {limits && (
                  <p className='mt-2 inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground'>
                    В этом месяце:
                    <span className='mx-1 font-semibold text-foreground'>
                      {limits.remaining} из {limits.monthlyLimit}
                    </span>
                    объявлений
                  </p>
                )}
              </div>
            </div>
          </header>

          <div id='property-form'>
            <ErrorBoundary fallback={FormErrorFallback}>
              <PropertyForm onSuccess={handleSuccess} />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
