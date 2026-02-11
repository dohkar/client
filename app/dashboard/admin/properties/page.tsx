"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks";
import { adminService } from "@/services/admin.service";
import { regionsService } from "@/services/regions.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PropertiesDataTable } from "@/components/admin/properties/properties-data-table";
import { createPropertyColumns } from "@/components/admin/properties/columns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { toast } from "sonner";

function PropertyStatusDialog({
  propertyId,
  status,
  onClose,
  onConfirm,
  isPending,
}: {
  propertyId: string;
  status: "ACTIVE" | "PENDING" | "REJECTED" | "SOLD" | "ARCHIVED";
  onClose: () => void;
  onConfirm: (rejectionReason?: string) => void;
  isPending: boolean;
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const statusLabels: Record<string, string> = {
    ACTIVE: "Активное",
    PENDING: "На модерации",
    REJECTED: "Отклонено",
    SOLD: "Продано",
    ARCHIVED: "Архив",
  };
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Изменить статус объявления</DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <p className='text-sm text-muted-foreground'>
            Новый статус: <strong>{statusLabels[status] ?? status}</strong>
          </p>
          <div className='space-y-2'>
            <Label htmlFor='rejection-reason'>Причина отклонения (необязательно)</Label>
            <Textarea
              id='rejection-reason'
              placeholder='Укажите причину, если отклоняете или снимаете с публикации'
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isPending}>
            Отмена
          </Button>
          <Button
            onClick={() => onConfirm(rejectionReason.trim() || undefined)}
            disabled={isPending}
          >
            Применить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPropertiesPage() {
  const queryClient = useQueryClient();
  const [propertiesSearch, setPropertiesSearch] = useState("");
  const [propertiesStatus, setPropertiesStatus] = useState<string>("all");
  const [propertiesType, setPropertiesType] = useState<string>("all");
  const [propertiesRegionId, setPropertiesRegionId] = useState<string>("all");
  const [propertiesSortBy, setPropertiesSortBy] = useState<string>("date-desc");
  const [propertyStatusDialog, setPropertyStatusDialog] = useState<{
    propertyId: string;
    status: "ACTIVE" | "PENDING" | "REJECTED" | "SOLD" | "ARCHIVED";
  } | null>(null);

  const debouncedPropertiesSearch = useDebounce(propertiesSearch, 500);

  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: [
      "admin",
      "properties",
      debouncedPropertiesSearch,
      propertiesStatus,
      propertiesType,
      propertiesRegionId,
      propertiesSortBy,
    ],
    queryFn: async () => {
      return adminService.getProperties({
        page: 1,
        limit: 1000,
        search: debouncedPropertiesSearch || undefined,
        status:
          propertiesStatus !== "all"
            ? (propertiesStatus as "ACTIVE" | "PENDING" | "REJECTED" | "SOLD" | "ARCHIVED")
            : undefined,
        type:
          propertiesType !== "all"
            ? (propertiesType as "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL")
            : undefined,
        regionId: propertiesRegionId !== "all" ? propertiesRegionId : undefined,
        sortBy: propertiesSortBy as "date-desc" | "date-asc" | "views-desc",
      });
    },
  });

  const { data: regions = [] } = useQuery({
    queryKey: ["regions"],
    queryFn: () => regionsService.getRegions(),
  });

  const updatePropertyStatusMutation = useMutation({
    mutationFn: ({
      propertyId,
      status,
      rejectionReason,
    }: {
      propertyId: string;
      status: "ACTIVE" | "PENDING" | "REJECTED" | "SOLD" | "ARCHIVED";
      rejectionReason?: string;
    }) => adminService.updatePropertyStatus(propertyId, { status, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "statistics"] });
      toast.success("Статус объявления изменен");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка изменения статуса");
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: (propertyId: string) => adminService.deleteProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "statistics"] });
      toast.success("Объявление удалено");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка удаления");
    },
  });

  return (
    <div className='space-y-6'>
      <Card className='border-primary/20'>
        <CardHeader>
          <div className='flex flex-col gap-4'>
            <CardTitle>Объявления</CardTitle>
            <div className='flex flex-col sm:flex-row gap-2 flex-wrap'>
              <div className='relative flex-1 min-w-[200px]'>
                <Search className='absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                <Input
                  placeholder='Поиск...'
                  value={propertiesSearch}
                  onChange={(e) => setPropertiesSearch(e.target.value)}
                  className='pl-8 min-h-[44px]'
                />
              </div>
              <Select value={propertiesStatus} onValueChange={setPropertiesStatus}>
                <SelectTrigger className='w-full sm:w-40 min-h-[44px]'>
                  <SelectValue placeholder='Статус' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Все статусы</SelectItem>
                  <SelectItem value='ACTIVE'>Активные</SelectItem>
                  <SelectItem value='PENDING'>На модерации</SelectItem>
                  <SelectItem value='REJECTED'>Отклонённые</SelectItem>
                  <SelectItem value='SOLD'>Продано</SelectItem>
                  <SelectItem value='ARCHIVED'>Архив</SelectItem>
                </SelectContent>
              </Select>
              <Select value={propertiesType} onValueChange={setPropertiesType}>
                <SelectTrigger className='w-full sm:w-40 min-h-[44px]'>
                  <SelectValue placeholder='Тип' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Все типы</SelectItem>
                  <SelectItem value='APARTMENT'>Квартиры</SelectItem>
                  <SelectItem value='HOUSE'>Дома</SelectItem>
                  <SelectItem value='LAND'>Участки</SelectItem>
                  <SelectItem value='COMMERCIAL'>Коммерческая</SelectItem>
                </SelectContent>
              </Select>
              <Select value={propertiesRegionId} onValueChange={setPropertiesRegionId}>
                <SelectTrigger className='w-full sm:w-44 min-h-[44px]'>
                  <SelectValue placeholder='Регион' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Все регионы</SelectItem>
                  {regions.map((r: { id: string; name: string }) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={propertiesSortBy} onValueChange={setPropertiesSortBy}>
                <SelectTrigger className='w-full sm:w-44 min-h-[44px]'>
                  <SelectValue placeholder='Сортировка' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='date-desc'>По дате (новые)</SelectItem>
                  <SelectItem value='date-asc'>По дате (старые)</SelectItem>
                  <SelectItem value='views-desc'>По просмотрам</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PropertiesDataTable
            columns={createPropertyColumns(
              (propertyId, status) => setPropertyStatusDialog({ propertyId, status }),
              (propertyId) => deletePropertyMutation.mutate(propertyId),
              deletePropertyMutation.isPending
            )}
            data={propertiesData?.data || []}
            isLoading={propertiesLoading}
            searchValue={debouncedPropertiesSearch}
            onSearchChange={setPropertiesSearch}
          />
          {propertyStatusDialog && (
            <PropertyStatusDialog
              propertyId={propertyStatusDialog.propertyId}
              status={propertyStatusDialog.status}
              onClose={() => setPropertyStatusDialog(null)}
              onConfirm={(rejectionReason) => {
                updatePropertyStatusMutation.mutate({
                  propertyId: propertyStatusDialog.propertyId,
                  status: propertyStatusDialog.status,
                  rejectionReason: rejectionReason || undefined,
                });
                setPropertyStatusDialog(null);
              }}
              isPending={updatePropertyStatusMutation.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
