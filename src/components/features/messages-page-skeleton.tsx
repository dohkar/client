import { Skeleton } from "@/components/ui/skeleton";

export function MessagesPageSkeleton() {
  return (
    <div className='mx-auto flex min-h-[70vh] max-w-6xl gap-4 px-4 py-6'>
      <aside className='hidden w-full max-w-[320px] shrink-0 flex-col gap-2 md:flex'>
        <Skeleton className='h-10 w-full' />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className='h-[4.5rem] w-full rounded-lg' />
        ))}
      </aside>
      <div className='flex flex-1 flex-col rounded-xl border bg-card'>
        <div className='flex items-center gap-3 border-b p-4'>
          <Skeleton className='size-10 rounded-full' />
          <div className='space-y-2'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='h-3 w-24' />
          </div>
        </div>
        <div className='flex flex-1 flex-col gap-3 p-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-12 rounded-lg ${i % 2 === 0 ? "mr-8" : "ml-8"}`}
            />
          ))}
        </div>
        <div className='border-t p-4'>
          <Skeleton className='h-11 w-full rounded-xl' />
        </div>
      </div>
    </div>
  );
}
