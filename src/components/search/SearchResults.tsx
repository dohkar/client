import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { PropertyCard } from "@/components/features/property-card";
import { PaginationBlock } from "./PaginationBlock";
import type { Property } from "@/types/property";

interface SearchResultsProps {
  properties: Property[];
  isLoading: boolean;
  error: Error | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onGoHome: () => void;
}

export function SearchResults({
  properties,
  isLoading,
  error,
  currentPage,
  totalPages,
  onPageChange,
  onResetFilters,
  onGoHome,
}: SearchResultsProps) {
  if (isLoading) {
    // Показываем скелетоны-заглушки, пока подгружаются данные
    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className='h-64 bg-muted animate-pulse rounded-lg' />
        ))}
      </div>
    );
  }

  if (error) {
    // Ошибка при загрузке — показываем сообщение
    return (
      <Empty
        icon={<Home className='text-muted-foreground' />}
        title='Ошибка загрузки'
        description={error.message || "Попробуйте обновить страницу"}
        action={
          <Button onClick={() => window.location.reload()} variant='default'>
            Обновить страницу
          </Button>
        }
      />
    );
  }

  if (properties.length === 0) {
    // Нет результатов по фильтрам
    return (
      <Empty
        icon={<Home className='text-muted-foreground' />}
        title='Объявления не найдены'
        description='Попробуйте изменить параметры поиска или фильтры'
        action={
          <div className='flex flex-col sm:flex-row gap-2'>
            <Button onClick={onResetFilters} variant='default'>
              Сбросить фильтры
            </Button>
            <Button onClick={onGoHome} variant='outline'>
              На главную
            </Button>
          </div>
        }
      />
    );
  }

  // Показываем реальные карточки и пагинацию
  return (
    <>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
        {properties.map((property, index) => (
          <PropertyCard 
            key={property.id} 
            property={property}
            priority={index === 0} // Первая карточка с priority для LCP
          />
        ))}
      </div>
      <PaginationBlock
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
}
