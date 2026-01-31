import { Skeleton } from "@/components/ui/skeleton";

export default function PropertyLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pb-12">
        {/* Навигационная цепочка */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-4" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-4" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>

        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Левая часть */}
            <div className="lg:col-span-8 space-y-6 sm:space-y-8">
              {/* Заголовок и кнопки */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <Skeleton className="h-8 sm:h-10 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-11 w-11 rounded-lg" />
                    <Skeleton className="h-11 w-11 rounded-lg" />
                  </div>
                </div>
              </div>

              {/* Галерея - Hero + Thumbs */}
              <div className="space-y-3">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <div className="flex gap-2">
                  <Skeleton className="aspect-[4/3] flex-1 rounded-lg" />
                  <Skeleton className="aspect-[4/3] flex-1 rounded-lg" />
                  <Skeleton className="aspect-[4/3] flex-1 rounded-lg" />
                  <Skeleton className="aspect-[4/3] flex-1 rounded-lg" />
                </div>
              </div>

              {/* Цена */}
              <Skeleton className="h-20 w-full rounded-xl" />

              {/* Характеристики */}
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <Skeleton className="h-6 w-32 mb-4 sm:mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 gap-x-4 sm:gap-x-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="flex justify-between items-baseline border-b border-border/50 pb-2"
                    >
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Описание */}
              <div className="bg-card rounded-xl border border-border p-6">
                <Skeleton className="h-6 w-24 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            </div>

            {/* Правая часть - Сайдбар */}
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <div className="bg-card rounded-xl border border-border p-4 sm:p-6 space-y-4">
                  {/* Цена */}
                  <div>
                    <Skeleton className="h-9 w-2/3 mb-2" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>

                  {/* Информация */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-2/3" />
                  </div>

                  {/* Характеристики */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>

                  {/* Кнопки */}
                  <div className="space-y-2 pt-2">
                    <Skeleton className="h-11 w-full rounded-lg" />
                    <Skeleton className="h-11 w-full rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
