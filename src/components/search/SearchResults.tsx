import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { PropertyCard } from "@/components/features/property-card";
import { PaginationBlock } from "./PaginationBlock";
import type { Property } from "@/types/property";
import { PropertyGridSkeleton } from "../features";

interface SearchResultsProps {
  properties: Property[];
  isLoading: boolean;
  error: Error | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onGoHome: () => void;
  /** Общее количество элементов */
  totalItems?: number;
  /** Количество элементов на странице */
  itemsPerPage?: number;
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
  totalItems,
  itemsPerPage = 12,
}: SearchResultsProps) {
  if (isLoading) {
    // Показываем скелетоны-заглушки, пока подгружаются данные
    return <PropertyGridSkeleton count={8} />;
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
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-4'>
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
      <PaginationBlock
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
      />
    </>
  );
}
