import { Skeleton } from "@/components/ui/skeleton";
import { PropertyGridSkeleton } from "@/components/features/property-grid-skeleton";

/**
 * Скелетон поиска по региону/категории (хлебные крошки, поле поиска, сетка).
 */
export function SearchRouteSkeleton() {
  return (
    <div className='mx-auto min-h-[50vh] w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8'>
      <div className='flex flex-wrap items-center gap-2'>
        <Skeleton className='h-4 w-20' />
        <Skeleton className='h-4 w-3' />
        <Skeleton className='h-4 w-28' />
        <Skeleton className='h-4 w-3' />
        <Skeleton className='h-4 w-36' />
      </div>

      <Skeleton className='h-11 w-full max-w-xl rounded-xl' />

      <div className='flex flex-wrap gap-2'>
        <Skeleton className='h-9 w-28 rounded-lg' />
        <Skeleton className='h-9 w-32 rounded-lg' />
        <Skeleton className='h-9 w-24 rounded-lg' />
        <Skeleton className='h-9 w-36 rounded-lg' />
      </div>

      <PropertyGridSkeleton count={8} />
    </div>
  );
}
