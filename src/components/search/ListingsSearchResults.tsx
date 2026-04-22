import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { ListingCard } from "@/components/features/listing-card";
import type { Listing } from "@/types/listing";
import { ListingGridSkeleton } from "../features";
import { PaginationBlock } from "./PaginationBlock";

interface ListingsSearchResultsProps {
  listings: Listing[];
  isLoading: boolean;
  error: Error | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onGoHome: () => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export function ListingsSearchResults({
  listings,
  isLoading,
  error,
  currentPage,
  totalPages,
  onPageChange,
  onResetFilters,
  onGoHome,
  totalItems,
  itemsPerPage = 12,
}: ListingsSearchResultsProps) {
  if (isLoading) {
    return <ListingGridSkeleton count={8} />;
  }

  if (error) {
    return (
      <Empty
        icon={<Home className="text-muted-foreground" />}
        title="Ошибка загрузки"
        description={error.message || "Попробуйте обновить страницу"}
        action={
          <Button onClick={() => window.location.reload()} variant="default">
            Обновить страницу
          </Button>
        }
      />
    );
  }

  if (listings.length === 0) {
    return (
      <Empty
        icon={<Home className="text-muted-foreground" />}
        title="Объявления не найдены"
        description="Попробуйте изменить параметры поиска или фильтры"
        action={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={onResetFilters} variant="default">
              Сбросить фильтры
            </Button>
            <Button onClick={onGoHome} variant="outline">
              На главную
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-4">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
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

