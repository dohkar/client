"use client";

import { PropertyCard } from "@/components/features/property-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { useRemoveFavoriteWithUndo } from "@/hooks/use-undo-delete";
import { useAuthStore } from "@/stores";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES } from "@/constants";

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, isLoading: authLoading } = useAuthStore();
  
  // Используем optimistic хуки с Undo
  const { favorites: data, isLoading } = useFavorites();
  const { removeWithUndo, isRemoving } = useRemoveFavoriteWithUndo();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace(ROUTES.login);
    }
  }, [isAuthenticated, isInitialized, router]);

  // Показываем фулл-скрин загрузку пока не инициализировались
  if (!isInitialized || authLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-muted/10'>
        <div className='flex flex-col items-center justify-center gap-3'>
          <span className='inline-block w-6 h-6 border-4 border-primary border-t-transparent border-solid rounded-full animate-spin' />
          <p className='text-muted-foreground text-base'>Загрузка...</p>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован, ничего не показываем (или перенаправит useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Лоадер для запроса избранного
  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-12'>
        <div className='flex flex-col items-center gap-3'>
          <span className='inline-block w-6 h-6 border-4 border-primary border-t-transparent border-solid rounded-full animate-spin' />
          <span className='text-muted-foreground text-base'>Загрузка избранного...</span>
        </div>
      </div>
    );
  }

  // Если избранное пустое
  if (!data.length) {
    return (
      <div className='container mx-auto px-4 py-8 sm:py-20 min-h-[60vh] flex flex-col justify-center'>
        <div className='max-w-xl mx-auto text-center'>
          <Card className='border-primary/20 shadow-md bg-white/90'>
            <CardContent className='p-6 sm:p-12 flex flex-col items-center justify-center'>
              <Heart className='w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 text-muted-foreground' />
              <h2 className='text-2xl sm:text-3xl font-bold mb-2'>Избранное пусто</h2>
              <p className='text-base sm:text-lg text-muted-foreground mb-8'>
                Добавьте понравившиеся объявления в избранное,&nbsp;чтобы быстро найти их
                позже.
              </p>
              <Button
                onClick={() => router.push(ROUTES.search)}
                className='btn-caucasus min-h-[48px] font-semibold w-full max-w-xs'
                size='lg'
              >
                Найти недвижимость
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Количество объявлений — более корректное склонение
  const declOfNum = (n: number, forms: [string, string, string]) => {
    return forms[
      n % 10 === 1 && n % 100 !== 11
        ? 0
        : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
          ? 1
          : 2
    ];
  };

  return (
    <div className='min-h-[70vh] bg-muted/10 py-8 sm:py-14'>
      <div className='container mx-auto px-2 md:px-4'>
        <div className='max-w-3xl mx-auto mb-8 sm:mb-12 text-center'>
          <h1 className='text-3xl sm:text-4xl font-bold mb-2 text-foreground'>
            Избранное
          </h1>
          <p className='text-base sm:text-lg text-muted-foreground'>
            {data.length}{" "}
            {declOfNum(data.length, ["объявление", "объявления", "объявлений"])}{" "}
            в&nbsp;избранном
          </p>
        </div>

        <div className='mx-auto max-w-7xl'>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 xl:gap-10'>
            {data.map((property) => {
              const removing = isRemoving(property.id);
              return (
                <div
                  key={property.id}
                  className={`
                    relative group flex flex-col h-full
                    transition-all duration-300 ease-out
                    ${removing ? "opacity-50 scale-95 pointer-events-none" : ""}
                  `}
                  style={{ minHeight: 410 }}
                >
                  <PropertyCard property={property} hideFavoriteButton />
                  {/* Overlayed delete button */}
                  <Button
                    variant='destructive'
                    size='icon'
                    className={`
                      absolute z-20 top-2.5 right-2.5
                      pointer-events-none opacity-0
                      group-hover:pointer-events-auto group-hover:opacity-100
                      sm:pointer-events-auto sm:opacity-100
                      transition-opacity
                      shadow-xl rounded-full
                      flex items-center justify-center
                      w-10 h-10
                      focus:outline-none focus:ring-2 focus:ring-primary/40
                    `}
                    onClick={() => removeWithUndo(property.id, property.title)}
                    disabled={removing}
                    aria-label='Удалить из избранного'
                    title='Удалить из избранного'
                    tabIndex={0}
                    aria-busy={removing}
                  >
                    {removing ? (
                      <span className='w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin' />
                    ) : (
                      <Trash2 className='w-5 h-5' />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
