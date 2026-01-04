"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useProperty } from "@/hooks/use-properties";
import { PropertyForm } from "@/components/features/property-form";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";
import { propertyService } from "@/services/property.service";
import { ROUTES } from "@/constants";

export default function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useAuthStore();
  const { data, isLoading, error } = useProperty(id);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center">
          <Spinner className="w-8 h-8" />
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Объявление не найдено</h1>
        <p className="text-muted-foreground">
          {error?.message || "Объявление с таким ID не существует"}
        </p>
      </div>
    );
  }

  const property = data.data;

  // Проверка прав доступа
  if (property.userId !== user?.id) {
    toast.error("У вас нет прав для редактирования этого объявления");
    router.push(`${ROUTES.dashboard}/listings`);
    return null;
  }

  const handleUpdate = async (updatedProperty: typeof property) => {
    try {
      await propertyService.updateProperty(id, updatedProperty);
      toast.success("Объявление обновлено");
      router.push(`/property/${id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка обновления");
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Редактировать объявление</h1>
          <p className="text-muted-foreground">
            Обновите информацию об объявлении
          </p>
        </div>
        <PropertyForm
          initialData={property}
          onSuccess={handleUpdate}
          isEdit={true}
        />
      </div>
    </div>
  );
}
