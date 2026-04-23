import { Skeleton } from "@/components/ui/skeleton";
import { ListingGridSkeleton } from "@/components/features/listing-grid-skeleton";

export function FavoritesPageSkeleton() {
  return (
    <div className='mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8'>
      <div className='space-y-2'>
        <Skeleton className='h-9 w-48' />
        <Skeleton className='h-4 w-72 max-w-full' />
      </div>
      <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
        <Skeleton className='h-10 w-full sm:max-w-xs' />
        <Skeleton className='h-10 w-full sm:w-40' />
        <Skeleton className='h-10 w-full sm:w-36' />
      </div>
      <ListingGridSkeleton count={8} />
    </div>
  );
}
