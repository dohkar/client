import { Skeleton } from "@/components/ui/skeleton";

function ThumbStrip() {
  return (
    <div className='flex justify-center gap-2 px-1 pt-1'>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton
          key={i}
          className='h-14 w-[4.5rem] shrink-0 rounded-lg sm:h-16 sm:w-24 md:h-[4.5rem] md:w-28'
        />
      ))}
    </div>
  );
}

/**
 * Скелетон страницы объявления (в т.ч. макет недвижимости: сетка 2+1, мобильный порядок блоков).
 */
export function ListingPageSkeleton() {
  return (
    <div className='mx-auto w-full max-w-7xl px-4 py-6'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
        <Skeleton className='h-9 w-28' />
        <div className='flex gap-1'>
          <Skeleton className='size-11 shrink-0 rounded-xl' />
          <Skeleton className='size-11 shrink-0 rounded-xl' />
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px] lg:items-start'>
        <div className='order-1 min-w-0 space-y-2 lg:order-none'>
          <Skeleton className='aspect-4/3 w-full max-lg:max-h-[min(70vw,420px)] rounded-xl lg:max-h-[min(560px,calc(100dvh-10rem))]' />
          <ThumbStrip />
        </div>

        <div className='order-2 lg:hidden'>
          <div className='rounded-xl border border-border bg-card p-5 shadow-sm'>
            <Skeleton className='h-10 w-48' />
            <Skeleton className='mt-3 h-4 w-32' />
            <Skeleton className='my-4 h-px w-full' />
            <div className='flex gap-3'>
              <Skeleton className='size-12 rounded-full' />
              <div className='space-y-2 pt-1'>
                <Skeleton className='h-5 w-36' />
                <Skeleton className='h-3 w-28' />
              </div>
            </div>
            <Skeleton className='mt-4 h-11 w-full rounded-xl' />
            <Skeleton className='mt-2 h-11 w-full rounded-xl' />
          </div>
        </div>

        <div className='order-3 flex min-w-0 flex-col gap-4 lg:order-none'>
          <div className='flex flex-wrap gap-2'>
            <Skeleton className='h-6 w-16 rounded-full' />
            <Skeleton className='h-6 w-24 rounded-full' />
          </div>
          <Skeleton className='h-8 w-full max-w-xl' />
          <div className='flex gap-2'>
            <Skeleton className='mt-0.5 size-4 shrink-0 rounded' />
            <Skeleton className='h-4 w-full max-w-md' />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='space-y-2'>
                <Skeleton className='h-3 w-14' />
                <Skeleton className='h-5 w-20' />
              </div>
            ))}
          </div>
          <div className='flex flex-wrap gap-2'>
            <Skeleton className='h-6 w-28 rounded-full' />
            <Skeleton className='h-6 w-36 rounded-full' />
            <Skeleton className='h-6 w-20 rounded-full' />
          </div>
          <Skeleton className='h-10 w-full max-w-sm rounded-xl' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-4/5' />
          </div>
        </div>

        <div className='order-4 hidden lg:order-none lg:block'>
          <div className='rounded-xl border border-border bg-card p-5 shadow-sm'>
            <Skeleton className='h-10 w-44' />
            <Skeleton className='mt-2 h-4 w-24' />
            <Skeleton className='my-4 h-px w-full' />
            <div className='flex gap-3'>
              <Skeleton className='size-12 rounded-full' />
              <div className='space-y-2 pt-1'>
                <Skeleton className='h-5 w-32' />
                <Skeleton className='h-3 w-36' />
              </div>
            </div>
            <Skeleton className='mt-4 h-11 w-full rounded-xl' />
            <Skeleton className='mt-2 h-11 w-full rounded-xl' />
            <Skeleton className='mx-auto mt-3 h-3 w-48' />
          </div>
        </div>
      </div>

      <div className='mt-8 space-y-3'>
        <Skeleton className='h-6 w-56' />
        <Skeleton className='h-48 w-full rounded-xl' />
      </div>

      <div className='mt-10 space-y-4'>
        <Skeleton className='h-7 w-48' />
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-64 rounded-xl' />
          ))}
        </div>
      </div>
    </div>
  );
}
