"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function AdminChatsPage() {
  const queryClient = useQueryClient();
  const [chatsType, setChatsType] = useState<string>("all");

  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ["admin", "chats", chatsType],
    queryFn: async () => {
      return adminService.getChats({
        page: 1,
        limit: 100,
        type: chatsType !== "all" ? (chatsType as "PROPERTY" | "SUPPORT") : undefined,
      });
    },
  });

  const closeChatMutation = useMutation({
    mutationFn: (chatId: string) => adminService.closeChat(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "statistics"] });
      toast.success("Чат закрыт");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка");
    },
  });

  return (
    <div className='space-y-6'>
      <Card className='border-primary/20'>
        <CardHeader>
          <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
            <CardTitle>Чаты</CardTitle>
            <Select value={chatsType} onValueChange={setChatsType}>
              <SelectTrigger className='w-full sm:w-44 min-h-[44px]'>
                <SelectValue placeholder='Тип' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Все</SelectItem>
                <SelectItem value='PROPERTY'>По объявлению</SelectItem>
                <SelectItem value='SUPPORT'>Поддержка</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {chatsLoading ? (
            <div className='text-sm text-muted-foreground'>Загрузка...</div>
          ) : !chatsData?.data?.length ? (
            <div className='text-sm text-muted-foreground'>Нет чатов</div>
          ) : (
            <div className='space-y-3'>
              {chatsData.data.map(
                (chat: import("@/services/admin.service").AdminChat) => (
                  <div
                    key={chat.id}
                    className='rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3'
                  >
                    <div>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <Badge variant='outline'>{chat.type}</Badge>
                        {chat.isArchived && <Badge variant='secondary'>Архив</Badge>}
                        {chat.property && (
                          <span className='text-sm text-muted-foreground'>
                            {chat.property.title}
                          </span>
                        )}
                      </div>
                      <p className='text-sm mt-1 truncate max-w-md'>
                        {chat.lastMessageText ?? "—"}
                      </p>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {chat.lastMessageAt
                          ? new Date(chat.lastMessageAt).toLocaleString()
                          : new Date(chat.createdAt).toLocaleString()}
                      </p>
                      {chat.participants?.length ? (
                        <p className='text-xs text-muted-foreground mt-1'>
                          Участники:{" "}
                          {chat.participants
                            .map((p) => p.user?.name || p.user?.email || p.userId)
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      ) : null}
                    </div>
                    {!chat.isArchived && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => {
                          if (confirm("Закрыть чат (архивировать)?")) {
                            closeChatMutation.mutate(chat.id);
                          }
                        }}
                        disabled={closeChatMutation.isPending}
                      >
                        Закрыть чат
                      </Button>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
