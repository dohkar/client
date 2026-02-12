"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks";
import { adminService } from "@/services/admin.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UsersDataTable } from "@/components/admin/users/users-data-table";
import { createUserColumns, type UserWithCount } from "@/components/admin/users/columns";
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

function BanUserDialog({
  userId,
  onClose,
  onConfirm,
  isPending,
}: {
  userId: string;
  onClose: () => void;
  onConfirm: (reason?: string, bannedUntil?: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");
  const [bannedUntil, setBannedUntil] = useState("");
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Заблокировать пользователя</DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <p className='text-sm text-muted-foreground'>ID: {userId}</p>
          <div className='space-y-2'>
            <Label htmlFor='ban-reason'>Причина (необязательно)</Label>
            <Textarea
              id='ban-reason'
              placeholder='Причина бана'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='ban-until'>Дата окончания бана (необязательно)</Label>
            <Input
              id='ban-until'
              type='datetime-local'
              value={bannedUntil}
              onChange={(e) => setBannedUntil(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isPending}>
            Отмена
          </Button>
          <Button
            variant='destructive'
            onClick={() => {
              const until = bannedUntil ? new Date(bannedUntil).toISOString() : undefined;
              onConfirm(reason || undefined, until);
            }}
            disabled={isPending}
          >
            Заблокировать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [usersSearch, setUsersSearch] = useState("");
  const [usersRole, setUsersRole] = useState<string>("all");
  const [usersStatus, setUsersStatus] = useState<string>("all");
  const [banUserId, setBanUserId] = useState<string | null>(null);

  const debouncedUsersSearch = useDebounce(usersSearch, 400);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users", debouncedUsersSearch, usersRole, usersStatus],
    queryFn: async () => {
      return adminService.getUsers({
        page: 1,
        limit: 1000,
        search: debouncedUsersSearch || undefined,
        role:
          usersRole !== "all"
            ? (usersRole as "USER" | "PREMIUM" | "ADMIN")
            : undefined,
        status: usersStatus !== "all" ? (usersStatus as "active" | "banned") : undefined,
      });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: "USER" | "PREMIUM" | "ADMIN";
    }) => adminService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "statistics"] });
      toast.success("Роль пользователя изменена");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка изменения роли");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "statistics"] });
      toast.success("Пользователь удален");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка удаления");
    },
  });

  const banUserMutation = useMutation({
    mutationFn: ({
      userId,
      reason,
      bannedUntil,
    }: {
      userId: string;
      reason?: string;
      bannedUntil?: string;
    }) => adminService.banUser(userId, { reason, bannedUntil }),
    onSuccess: () => {
      setBanUserId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "statistics"] });
      toast.success("Пользователь заблокирован");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка блокировки");
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: (userId: string) => adminService.unbanUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "statistics"] });
      toast.success("Пользователь разблокирован");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка разблокировки");
    },
  });

  return (
    <div className='space-y-6'>
      <Card className='border-primary/20'>
        <CardHeader>
          <div className='flex flex-col gap-4'>
            <CardTitle>Пользователи</CardTitle>
            <div className='flex flex-col sm:flex-row gap-2 flex-wrap'>
              <div className='relative flex-1 min-w-[200px]'>
                <Search className='absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                <Input
                  placeholder='Поиск по email, имени, телефону...'
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  className='pl-8 min-h-[44px]'
                />
              </div>
              <Select value={usersRole} onValueChange={setUsersRole}>
                <SelectTrigger className='w-full sm:w-40 min-h-[44px]'>
                  <SelectValue placeholder='Роль' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Все роли</SelectItem>
                  <SelectItem value='USER'>USER</SelectItem>
                  <SelectItem value='PREMIUM'>PREMIUM</SelectItem>
                  <SelectItem value='ADMIN'>ADMIN</SelectItem>
                </SelectContent>
              </Select>
              <Select value={usersStatus} onValueChange={setUsersStatus}>
                <SelectTrigger className='w-full sm:w-40 min-h-[44px]'>
                  <SelectValue placeholder='Статус' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Все</SelectItem>
                  <SelectItem value='active'>Активные</SelectItem>
                  <SelectItem value='banned'>Заблокированные</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UsersDataTable
            columns={createUserColumns(
              (userId, role) => updateUserRoleMutation.mutate({ userId, role }),
              (userId) => deleteUserMutation.mutate(userId),
              (userId) => setBanUserId(userId),
              (userId) => unbanUserMutation.mutate(userId),
              deleteUserMutation.isPending
            )}
            data={(usersData?.data || []) as UserWithCount[]}
            isLoading={usersLoading}
            searchValue={debouncedUsersSearch}
            onSearchChange={setUsersSearch}
          />
        </CardContent>
      </Card>
      {banUserId && (
        <BanUserDialog
          userId={banUserId}
          onClose={() => setBanUserId(null)}
          onConfirm={(reason, bannedUntil) => {
            banUserMutation.mutate({ userId: banUserId, reason, bannedUntil });
          }}
          isPending={banUserMutation.isPending}
        />
      )}
    </div>
  );
}
