"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { LayoutList, ChevronLeft } from "lucide-react";
import { usersService } from "@/services/users.service";
import { listingsService } from "@/services/listings.service";
import { queryKeys } from "@/lib/react-query/query-keys";
import { ROUTES, PAGINATION } from "@/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ListingCard } from "@/components/features/listing-card";
import { Empty } from "@/components/ui/empty";
import { useAuthStore } from "@/stores";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function displayUserId(id: string) {
  const compact = id.replace(/-/g, "");
  if (compact.length <= 8) return compact.toUpperCase();
  return compact.slice(0, 8).toUpperCase();
}

export default function PublicProfilePage() {
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const userId = UUID_REGEX.test(rawId) ? rawId : "";

  const { user: me } = useAuthStore();

  const profileQuery = useQuery({
    queryKey: queryKeys.user.publicProfile(userId),
    queryFn: () => usersService.getPublicProfile(userId),
    enabled: !!userId,
  });

  const listingsQuery = useQuery({
    queryKey: queryKeys.listings.list({
      sellerId: userId,
      page: 1,
      limit: PAGINATION.propertiesMaxLimit,
      sortBy: "date-desc",
    }),
    queryFn: () =>
      listingsService.getListings({
        sellerId: userId,
        page: 1,
        limit: PAGINATION.propertiesMaxLimit,
        sortBy: "date-desc",
      }),
    enabled: !!userId,
  });

  if (!userId) {
    return (
      <div className='container mx-auto px-4 py-16 text-center'>
        <p className='text-muted-foreground'>Некорректная ссылка на профиль.</p>
        <Button asChild variant='outline' className='mt-6'>
          <Link href={ROUTES.home}>На главную</Link>
        </Button>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className='container mx-auto px-4 py-16 text-center'>
        <p className='text-muted-foreground'>Пользователь не найден.</p>
        <Button asChild variant='outline' className='mt-6'>
          <Link href={ROUTES.home}>На главную</Link>
        </Button>
      </div>
    );
  }

  const profile = profileQuery.data;
  const listings = listingsQuery.data?.data ?? [];
  const isOwn = me?.id === userId;

  return (
    <div className='min-h-[calc(100vh-65px)] border-t border-border/60 bg-muted/10'>
      <div className='container mx-auto px-3 sm:px-4 py-6 lg:py-8'>
        <div className='mb-6'>
          <Button variant='ghost' size='sm' asChild className='gap-1 -ml-2 mb-4'>
            <Link href={ROUTES.home}>
              <ChevronLeft className='h-4 w-4' />
              На главную
            </Link>
          </Button>
        </div>

        <div className='flex flex-col gap-6 lg:flex-row lg:gap-8'>
          <aside className='w-full shrink-0 lg:w-64'>
            <div className='rounded-xl border border-border bg-card/90 shadow-sm p-4'>
              {profileQuery.isLoading ? (
                <div className='animate-pulse space-y-3'>
                  <div className='h-14 w-14 rounded-full bg-muted mx-auto' />
                  <div className='h-4 bg-muted rounded mx-auto w-32' />
                  <div className='h-3 bg-muted rounded mx-auto w-24' />
                </div>
              ) : profile ? (
                <>
                  <div className='flex flex-col items-center text-center gap-2'>
                    <Avatar className='h-16 w-16 border border-border'>
                      <AvatarImage src={profile.avatar ?? undefined} alt='' />
                      <AvatarFallback className='text-lg'>
                        {(profile.name?.trim()?.[0] ?? "?").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='font-semibold text-lg'>
                        {profile.name?.trim() || "Пользователь"}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        ID: {displayUserId(profile.id)}
                      </p>
                      {profile.isPremium ? (
                        <Badge className='mt-2' variant='secondary'>
                          Premium
                        </Badge>
                      ) : null}
                      <p className='text-xs text-muted-foreground mt-2'>
                        На платформе с{" "}
                        {new Date(profile.createdAt).toLocaleDateString("ru-RU", {
                          year: "numeric",
                          month: "long",
                        })}
                      </p>
                    </div>
                  </div>
                  {isOwn ? (
                    <Button asChild className='w-full mt-4'>
                      <Link href={ROUTES.accountListings}>Личный кабинет</Link>
                    </Button>
                  ) : null}
                </>
              ) : null}
            </div>
          </aside>

          <section className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-4'>
              <LayoutList className='h-5 w-5 text-primary' />
              <h1 className='text-xl sm:text-2xl font-bold'>Объявления</h1>
            </div>
            {listingsQuery.isLoading ? (
              <p className='text-sm text-muted-foreground'>Загрузка объявлений…</p>
            ) : listings.length === 0 ? (
              <Empty
                title='Тут объявлений нет'
                description='У этого пользователя пока нет активных объявлений.'
              />
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5'>
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
