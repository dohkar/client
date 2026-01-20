"use client";

import { useQuery } from "@tanstack/react-query";
import { propertyService } from "@/services/property.service";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useAuthStore } from "@/stores";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/format";
import { ROUTES } from "@/constants";
import { useDeleteWithUndo } from "@/hooks/use-undo-delete";
import type { Property } from "@/types/property";

export default function ListingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Delete с Undo (5 секунд на отмену)
  const { deleteWithUndo, isDeleting } = useDeleteWithUndo();

  // Получаем все объявления пользователя
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.properties.list({}),
    queryFn: async () => {
      const response = await propertyService.getProperties({ limit: 100 });
      return response.data?.filter((p: Property) => p.userId === user?.id) || [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Мои объявления</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {data?.length || 0} {data?.length === 1 ? "объявление" : "объявлений"}
          </p>
        </div>
        <Link href={ROUTES.sell}>
          <Button className="btn-caucasus min-h-[44px] w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Создать объявление
          </Button>
        </Link>
      </div>

      {!data || data.length === 0 ? (
        <Card className="border-primary/20 shadow-sm">
          <CardContent className="p-8 sm:p-12 text-center">
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              У вас пока нет объявлений
            </p>
            <Link href={ROUTES.sell}>
              <Button className="btn-caucasus min-h-[44px]">Создать первое объявление</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {data.map((property: Property) => {
            const deleting = isDeleting(property.id);
            return (
              <Card 
                key={property.id} 
                className={`
                  border-primary/20 transition-all
                  ${deleting 
                    ? "opacity-50 scale-95 pointer-events-none" 
                    : "hover:shadow-xl hover:-translate-y-1"
                  }
                `}
              >
                <CardContent className="p-0">
                  <div className="relative group">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-48 object-cover rounded-t-xl"
                    />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/property/${property.id}`)}
                        className="min-h-[36px] min-w-[36px] shadow-md"
                        aria-label="Просмотреть"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/dashboard/listings/${property.id}/edit`)}
                        className="min-h-[36px] min-w-[36px] shadow-md"
                        aria-label="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteWithUndo(property.id, property.title)}
                        disabled={deleting}
                        className="min-h-[36px] min-w-[36px] shadow-md"
                        aria-label="Удалить"
                      >
                        {deleting ? (
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5">
                    <h3 className="font-semibold mb-2 line-clamp-2 text-sm sm:text-base">{property.title}</h3>
                    <p className="text-xl sm:text-2xl font-bold text-primary mb-2">
                      {formatCurrency(property.price, property.currency)}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                      {property.location}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                      <span>Создано: {formatDate(property.datePosted, "ru-RU", { relative: true })}</span>
                      <span>👁 {property.views || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
