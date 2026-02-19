import { Pagination, PaginationContent } from "@/components/ui/pagination";

interface PaginationBlockProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Общее количество элементов (для отображения "Показано 1-20 из 100") */
  totalItems?: number;
  /** Количество элементов на странице (по умолчанию 12) */
  itemsPerPage?: number;
  /** Показывать информацию о количестве элементов */
  showItemsInfo?: boolean;
  /** Показывать кнопку "Перейти к странице" на десктопе */
  showJumpButton?: boolean;
}

export function PaginationBlock({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 12,
  showItemsInfo = true,
  showJumpButton = true,
}: PaginationBlockProps) {
  if (totalPages <= 1) return null;

  return (
    <div className='mt-12'>
      <Pagination>
        <PaginationContent
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          showItemsInfo={showItemsInfo}
          showJumpButton={showJumpButton}
        />
      </Pagination>
    </div>
  );
}
