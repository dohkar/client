"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService, type AdminListing } from "@/services/admin.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, Trash2, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { ROUTES } from "@/constants";
import { queryKeys } from "@/lib/react-query/query-keys";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/format";

const MODERATION_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  PENDING: "На модерации",
  APPROVED: "Одобрено",
  REJECTED: "Отклонено",
};

const CATEGORY_LABELS: Record<string, string> = {
  REAL_ESTATE: "Недвижимость",
};

function RejectDialog({
  listingId: _listingId,
  listingTitle,
  onClose,
  onConfirm,
  isPending,
}: {
  listingId: string;
  listingTitle: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [rejectionReason, setRejectionReason] = useState("");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отклонить объявление</DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <p className='text-sm text-muted-foreground'>
            Объявление: <strong className='text-foreground'>{listingTitle}</strong>
          </p>
          <div className='space-y-2'>
            <Label htmlFor='rejection-reason'>Причина отклонения</Label>
            <Textarea
              id='rejection-reason'
              placeholder='Укажите причину отклонения (обязательно)'
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
            variant='destructive'
            onClick={() => onConfirm(rejectionReason.trim())}
            disabled={!rejectionReason.trim() || isPending}
          >
            {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : "Отклонить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminListingsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [moderationStatus, setModerationStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [rejectDialog, setRejectDialog] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const limit = 20;
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "listings", page, moderationStatus, category],
    queryFn: () =>
      adminService.getListings({
        page,
        limit,
        moderationStatus:
          moderationStatus === "all"
            ? undefined
            : (moderationStatus as "DRAFT" | "PENDING" | "APPROVED" | "REJECTED"),
        category: category === "all" ? undefined : (category as "REAL_ESTATE"),
      }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminService.approveListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.categoryStats });
      toast.success("Объявление одобрено");
    },
    onError: () => toast.error("Не удалось одобрить"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.rejectListing(id, reason),
    onSuccess: () => {
      setRejectDialog(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.categoryStats });
      toast.success("Объявление отклонено");
    },
    onError: () => toast.error("Не удалось отклонить"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.categoryStats });
      toast.success("Объявление архивировано");
    },
    onError: () => toast.error("Не удалось удалить"),
  });

  const listings = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Модерация листингов
          </CardTitle>
          <p className='text-sm text-muted-foreground'>
            Одобрение, отклонение и удаление объявлений (листингов) по категориям.
          </p>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-wrap gap-4'>
            <div className='space-y-2'>
              <Label>Статус модерации</Label>
              <Select
                value={moderationStatus}
                onValueChange={(v) => {
                  setModerationStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className='w-[180px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Все</SelectItem>
                  {Object.entries(MODERATION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Категория</Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className='w-[180px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Все</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : listings.length === 0 ? (
            <p className='py-8 text-center text-muted-foreground'>
              Нет объявлений по выбранным фильтрам.
            </p>
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Категория</TableHead>
                      <TableHead>Модерация</TableHead>
                      <TableHead>Цена</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead className='text-right'>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.map((row: AdminListing) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Link
                            href={ROUTES.listing(row.id, row.slug)}
                            className='font-medium text-primary hover:underline'
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            {row.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {CATEGORY_LABELS[row.category] ?? row.category}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              row.moderationStatus === "PENDING"
                                ? "text-amber-600"
                                : row.moderationStatus === "REJECTED"
                                  ? "text-destructive"
                                  : row.moderationStatus === "APPROVED"
                                    ? "text-green-600"
                                    : ""
                            }
                          >
                            {MODERATION_LABELS[row.moderationStatus] ??
                              row.moderationStatus}
                          </span>
                        </TableCell>
                        <TableCell>{formatPrice(row.price)}</TableCell>
                        <TableCell>{row.user?.name ?? row.user?.email ?? "—"}</TableCell>
                        <TableCell>
                          {new Date(row.createdAt).toLocaleDateString("ru-RU")}
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex justify-end gap-2'>
                            {row.moderationStatus === "PENDING" && (
                              <>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  className='text-green-600 hover:text-green-700'
                                  onClick={() => approveMutation.mutate(row.id)}
                                  disabled={
                                    approveMutation.isPending || rejectMutation.isPending
                                  }
                                  title='Одобрить'
                                >
                                  {approveMutation.isPending &&
                                  approveMutation.variables === row.id ? (
                                    <Loader2 className='h-4 w-4 animate-spin' />
                                  ) : (
                                    <Check className='h-4 w-4' />
                                  )}
                                </Button>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  className='text-destructive'
                                  onClick={() =>
                                    setRejectDialog({
                                      id: row.id,
                                      title: row.title,
                                    })
                                  }
                                  disabled={
                                    approveMutation.isPending || rejectMutation.isPending
                                  }
                                  title='Отклонить'
                                >
                                  <X className='h-4 w-4' />
                                </Button>
                              </>
                            )}
                            <Button
                              size='sm'
                              variant='ghost'
                              className='text-destructive hover:text-destructive'
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Архивировать объявление? Это действие можно отменить только через БД."
                                  )
                                ) {
                                  deleteMutation.mutate(row.id);
                                }
                              }}
                              disabled={
                                deleteMutation.isPending ||
                                approveMutation.isPending ||
                                rejectMutation.isPending
                              }
                              title='Удалить (архивировать)'
                            >
                              {deleteMutation.isPending &&
                              deleteMutation.variables === row.id ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                              ) : (
                                <Trash2 className='h-4 w-4' />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className='flex items-center justify-between'>
                  <p className='text-sm text-muted-foreground'>
                    Всего: {total}. Страница {page} из {totalPages}.
                  </p>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Назад
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Вперёд
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {rejectDialog && (
        <RejectDialog
          listingId={rejectDialog.id}
          listingTitle={rejectDialog.title}
          onClose={() => setRejectDialog(null)}
          onConfirm={(reason) => rejectMutation.mutate({ id: rejectDialog.id, reason })}
          isPending={rejectMutation.isPending}
        />
      )}
    </div>
  );
}
