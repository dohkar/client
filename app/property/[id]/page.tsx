import { Suspense } from "react";
import { getProperty } from "@/lib/server/property";
import PropertyPageClient from "./PropertyPageClient";
import PropertyLoading from "./loading";

/**
 * Server Component для property page с prefetch данных
 * Получает данные на сервере и передаёт в клиентский компонент
 */
export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Получаем данные на сервере (используется кеш из layout)
  const property = await getProperty(id);

  return (
    <Suspense fallback={<PropertyLoading />}>
      <PropertyPageClient params={params} initialData={property} />
    </Suspense>
  );
}
