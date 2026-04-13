import { Skeleton } from "@/components/ui/skeleton";

export function DashboardListingsSkeleton() {
  return (
    <div className='mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-9 w-56' />
          <Skeleton className='h-4 w-64' />
        </div>
        <Skeleton className='h-11 w-40' />
      </div>
      <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap'>
        <Skeleton className='h-10 flex-1 sm:max-w-md' />
        <Skeleton className='h-10 w-full sm:w-36' />
        <Skeleton className='h-10 w-full sm:w-40' />
      </div>
      <div className='space-y-3'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-28 w-full rounded-xl' />
        ))}
      </div>
    </div>
  );
}
