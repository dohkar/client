"use client";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SellPageSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Заголовок */}
          <div className="space-y-2">
            <Skeleton className="h-8 sm:h-9 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>

          {/* Основная информация - Card */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <Skeleton className="h-6 w-48 flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-40" />
              </Skeleton>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Заголовок */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-11 w-full" />
              </div>
              {/* Цена */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-11 w-full" />
              </div>
              {/* Адрес */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-11 w-full" />
              </div>
              {/* Регион и Тип */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-11 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-11 w-full" />
                </div>
              </div>
              {/* Комнаты и Площадь */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-11 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-11 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Описание - Card */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <Skeleton className="h-6 w-32 flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-24" />
              </Skeleton>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-32 w-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Изображения - Card */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40 flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-32" />
                </Skeleton>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Skeleton className="h-48 w-full rounded-xl" />
            </CardContent>
          </Card>

          {/* Кнопка отправки */}
          <div className="flex justify-end pt-4">
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}
