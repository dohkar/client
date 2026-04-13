import { Skeleton } from "@/components/ui/skeleton";

export default function PropertyDetailLoading() {
  return (
    <div className='mx-auto max-w-7xl px-4 py-6'>
      <Skeleton className='mb-4 h-9 w-32' />
      <div className='grid gap-6 md:grid-cols-[1fr_1fr_340px]'>
        <Skeleton className='aspect-4/3 rounded-xl' />
        <div className='space-y-3'>
          <Skeleton className='h-6 w-3/4' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-32 w-full' />
        </div>
        <Skeleton className='h-80 rounded-xl' />
      </div>
    </div>
  );
}
