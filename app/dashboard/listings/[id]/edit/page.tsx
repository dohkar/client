"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useListing } from "@/hooks/use-listings";
import { ListingForm } from "@/components/features/listing-form";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";
import { ROUTES } from "@/constants";

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useAuthStore();
  const { data, isLoading, error } = useListing(id);

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-12'>
        <div className='flex justify-center'>
          <Spinner className='w-8 h-8' />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className='container mx-auto px-4 py-12 text-center'>
        <h1 className='text-2xl font-bold mb-4'>Объявление не найдено</h1>
        <p className='text-muted-foreground'>
          {error instanceof Error ? error.message : "Объявление с таким ID не существует"}
        </p>
      </div>
    );
  }

  const listing = data;

  if (listing.userId !== user?.id) {
    toast.error("У вас нет прав для редактирования этого объявления");
    router.push(`${ROUTES.dashboard}/listings`);
    return null;
  }

  return (
    <div className='container mx-auto px-4 py-12'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold mb-2'>Редактировать объявление</h1>
          <p className='text-muted-foreground'>Обновите информацию об объявлении</p>
        </div>
        <ListingForm
          listingId={id}
          initialListing={listing}
          onSuccess={(updated) => {
            router.push(ROUTES.listing(updated.id, updated.slug));
          }}
        />
      </div>
    </div>
  );
}
