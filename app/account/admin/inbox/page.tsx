"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

function InboxItemRow({
  item,
  onUpdateStatus,
  isPending,
}: {
  item: import("@/services/admin.service").InboxRequestItem;
  onUpdateStatus: (
    status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED",
    adminComment?: string
  ) => void;
  isPending: boolean;
}) {
  const [comment, setComment] = useState(item.adminComment ?? "");
  const [status, setStatus] = useState<"NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED">(
    item.status as "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
  );
  return (
    <div className='rounded-lg border border-border p-4 flex flex-col gap-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge variant='secondary'>{item.category}</Badge>
        <Badge variant={item.severity === "HIGH" ? "destructive" : "outline"}>
          {item.severity}
        </Badge>
        <Badge variant='outline'>{item.status}</Badge>
        {item.propertyId && <Badge variant='outline'>property: {item.propertyId}</Badge>}
      </div>
      <div className='text-sm'>
        <span className='font-medium'>{item.name}</span>
        {item.email && <span className='text-muted-foreground'> • {item.email}</span>}
        {item.phone && <span className='text-muted-foreground'> • {item.phone}</span>}
      </div>
      <div className='text-sm text-muted-foreground whitespace-pre-wrap'>
        {item.message}
      </div>
      {item.adminComment && (
        <div className='text-sm bg-muted/50 p-2 rounded'>
          <span className='font-medium'>Комментарий админа: </span>
          {item.adminComment}
        </div>
      )}
      {item.statusHistory && item.statusHistory.length > 0 && (
        <div className='text-xs text-muted-foreground space-y-1'>
          История:{" "}
          {item.statusHistory
            .map((h) => `${h.status} (${new Date(h.createdAt).toLocaleString()})`)
            .join(" → ")}
        </div>
      )}
      <div className='flex flex-col sm:flex-row gap-2 items-start'>
        <div className='space-y-1 w-full sm:w-auto'>
          <Label className='text-xs'>Комментарий админа</Label>
          <Textarea
            placeholder='Комментарий к заявке'
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className='min-w-[200px]'
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            const s = value as "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
            setStatus(s);
            onUpdateStatus(s, comment.trim() || undefined);
          }}
        >
          <SelectTrigger className='min-w-[200px] min-h-[44px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='NEW'>NEW</SelectItem>
            <SelectItem value='IN_PROGRESS'>IN_PROGRESS</SelectItem>
            <SelectItem value='RESOLVED'>RESOLVED</SelectItem>
            <SelectItem value='CLOSED'>CLOSED</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size='sm'
          onClick={() => onUpdateStatus(status, comment.trim() || undefined)}
          disabled={isPending}
          className='min-h-[44px]'
        >
          Сохранить
        </Button>
      </div>
    </div>
  );
}

export default function AdminInboxPage() {
  const queryClient = useQueryClient();
  const [inboxCategory, setInboxCategory] = useState<string>("all");
  const [inboxSeverity, setInboxSeverity] = useState<string>("all");
  const [inboxStatus, setInboxStatus] = useState<string>("all");

  const { data: inboxData, isLoading: inboxLoading } = useQuery({
    queryKey: ["admin", "inbox", inboxCategory, inboxSeverity, inboxStatus],
    queryFn: async () => {
      return adminService.getInboxRequests({
        category:
          inboxCategory !== "all"
            ? (inboxCategory as "CONTACT" | "COMPLAINT")
            : undefined,
        severity:
          inboxSeverity !== "all"
            ? (inboxSeverity as "LOW" | "MEDIUM" | "HIGH")
            : undefined,
        status:
          inboxStatus !== "all"
            ? (inboxStatus as "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED")
            : undefined,
      });
    },
  });

  const updateInboxStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      adminComment,
    }: {
      id: string;
      status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
      adminComment?: string;
    }) => adminService.updateInboxStatus(id, { status, adminComment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "inbox"] });
      toast.success("Статус заявки обновлен");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка обновления статуса");
    },
  });

  return (
    <div className='space-y-6'>
      <Card className='border-primary/20'>
        <CardHeader>
          <CardTitle>Входящие (ОБРАЩЕНИЯ + ЖАЛОБЫ)</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            <div className='space-y-2'>
              <div className='text-sm text-muted-foreground'>Категория</div>
              <Select value={inboxCategory} onValueChange={setInboxCategory}>
                <SelectTrigger className='min-h-[44px]'>
                  <SelectValue placeholder='Все' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Все</SelectItem>
                  <SelectItem value='CONTACT'>Обратная связь</SelectItem>
                  <SelectItem value='COMPLAINT'>Жалоба</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <div className='text-sm text-muted-foreground'>Серьезность</div>
              <Select value={inboxSeverity} onValueChange={setInboxSeverity}>
                <SelectTrigger className='min-h-[44px]'>
                  <SelectValue placeholder='Все' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Все</SelectItem>
                  <SelectItem value='LOW'>Низкая</SelectItem>
                  <SelectItem value='MEDIUM'>Средняя</SelectItem>
                  <SelectItem value='HIGH'>Высокая</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <div className='text-sm text-muted-foreground'>Статус</div>
              <Select value={inboxStatus} onValueChange={setInboxStatus}>
                <SelectTrigger className='min-h-[44px]'>
                  <SelectValue placeholder='Все' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Все</SelectItem>
                  <SelectItem value='NEW'>Новая</SelectItem>
                  <SelectItem value='IN_PROGRESS'>В обработке</SelectItem>
                  <SelectItem value='RESOLVED'>Решена</SelectItem>
                  <SelectItem value='CLOSED'>Закрыта</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {inboxLoading ? (
            <div className='text-sm text-muted-foreground'>Загрузка...</div>
          ) : !inboxData || inboxData.length === 0 ? (
            <div className='text-sm text-muted-foreground'>Нет заявок</div>
          ) : (
            <div className='space-y-3'>
              {inboxData.map(
                (item: import("@/services/admin.service").InboxRequestItem) => (
                  <InboxItemRow
                    key={item.id}
                    item={item}
                    onUpdateStatus={(status, adminComment) =>
                      updateInboxStatusMutation.mutate({
                        id: item.id,
                        status,
                        adminComment,
                      })
                    }
                    isPending={updateInboxStatusMutation.isPending}
                  />
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
