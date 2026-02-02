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
import { toast } from "sonner";

function FormErrorFallback() {
  return (
    <Card className='border-destructive'>
      <CardHeader>
        <CardTitle className='text-destructive'>Ошибка загрузки формы</CardTitle>
        <CardDescription>
          Произошла ошибка при загрузке формы. Пожалуйста, обновите страницу.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => window.location.reload()}
          variant='default'
          aria-label='Обновить страницу'
        >
          Обновить страницу
        </Button>
      </CardContent>
    </Card>
  );
}

export function SellFormSection() {
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
      className='min-h-screen bg-muted/30'
      style={{
        animation: "fadeIn 0.5s ease-out",
      }}
    >
      <div className='container mx-auto px-2 sm:px-4 py-6 sm:py-8 md:py-12'>
        <div className='max-w-4xl mx-auto space-y-6'>
          <a
            href='#property-form'
            className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg'
          >
            Перейти к форме
          </a>
          <div className='mb-6 sm:mb-8 space-y-2'>
            <h1 className='text-2xl sm:text-3xl font-bold text-foreground'>
              Разместить объявление
            </h1>
            <p className='text-sm sm:text-base text-muted-foreground'>
              Заполните форму ниже, чтобы разместить ваше объявление
            </p>
          </div>
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
