import { Skeleton } from "@/components/ui/skeleton";
import { ListingGridSkeleton } from "@/components/features/listing-grid-skeleton";

/**
 * Скелетон главной: hero + сетка объявлений.
 */
export function HomePageSkeleton() {
  return (
    <div className='flex min-h-screen flex-col'>
      <main className='flex-1'>
        <section className='border-b bg-muted/30 px-4 py-10 sm:px-6 lg:px-8'>
          <div className='mx-auto max-w-4xl space-y-6 text-center'>
            <Skeleton className='mx-auto h-10 w-full max-w-lg' />
            <Skeleton className='mx-auto h-5 w-full max-w-md' />
            <div className='mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center'>
              <Skeleton className='h-12 flex-1 rounded-xl' />
              <Skeleton className='h-12 w-full rounded-xl sm:w-36' />
            </div>
          </div>
        </section>

        <div className='mx-auto mt-4 max-w-7xl space-y-3 px-4 sm:px-6 lg:px-8'>
          <Skeleton className='h-5 w-48' />
          <Skeleton className='h-5 w-40' />
        </div>

        <section className='mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12'>
          <ListingGridSkeleton count={12} />
        </section>
      </main>
    </div>
  );
}
