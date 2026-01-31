"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks";
import { useAuthStore } from "@/stores";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { adminService } from "@/services/admin.service";
import { regionsService } from "@/services/regions.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UsersDataTable } from "@/components/admin/users/users-data-table";
import { createUserColumns, type UserWithCount } from "@/components/admin/users/columns";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Home,
  Eye,
  Search,
  CheckCircle2,
  MessageSquare,
  Ban,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const AdminOverviewCharts = dynamic(
  () => import("@/components/admin/AdminOverviewCharts"),
  { ssr: false }
);

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

function PropertyStatusDialog({
  propertyId,
  status,
  onClose,
  onConfirm,
  isPending,
}: {
  propertyId: string;
  status: "ACTIVE" | "PENDING" | "SOLD" | "ARCHIVED";
  onClose: () => void;
  onConfirm: (rejectionReason?: string) => void;
  isPending: boolean;
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const statusLabels: Record<string, string> = {
    ACTIVE: "Активное",
    PENDING: "На модерации",
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
            <Label htmlFor='ban-until'>Дата окончания бана (необязательно, ISO)</Label>
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

export default function AdminPage() {
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "properties" | "inbox" | "chats" | "logs"
  >("overview");
  const [usersSearch, setUsersSearch] = useState("");
  const [usersRole, setUsersRole] = useState<string>("all");
  const [usersStatus, setUsersStatus] = useState<string>("all");
  const [propertiesSearch, setPropertiesSearch] = useState("");
  const [propertiesStatus, setPropertiesStatus] = useState<string>("all");
  const [propertiesType, setPropertiesType] = useState<string>("all");
  const [propertiesRegionId, setPropertiesRegionId] = useState<string>("all");
  const [propertiesSortBy, setPropertiesSortBy] = useState<string>("date-desc");

  const [inboxCategory, setInboxCategory] = useState<string>("all");
  const [inboxSeverity, setInboxSeverity] = useState<string>("all");
  const [inboxStatus, setInboxStatus] = useState<string>("all");

  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [chatsType, setChatsType] = useState<string>("all");
  const [propertyStatusDialog, setPropertyStatusDialog] = useState<{
    propertyId: string;
    status: "ACTIVE" | "PENDING" | "SOLD" | "ARCHIVED";
  } | null>(null);

  const debouncedUsersSearch = useDebounce(usersSearch, 400);
  const debouncedPropertiesSearch = useDebounce(propertiesSearch, 400);

  // Проверка роли админа (без учёта регистра)
  const backofficeRoles = ["ADMIN", "SUPPORT", "MODERATOR"];
  const isBackoffice = user?.role && backofficeRoles.includes(user.role.toUpperCase());

  // Statistics
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "statistics"],
    queryFn: async () => {
      return adminService.getStatistics();
    },
    enabled: isInitialized && isAuthenticated && isBackoffice,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users", debouncedUsersSearch, usersRole, usersStatus],
    queryFn: async () => {
      return adminService.getUsers({
        page: 1,
        limit: 1000,
        search: debouncedUsersSearch || undefined,
        role:
          usersRole !== "all"
            ? (usersRole as "USER" | "PREMIUM" | "ADMIN" | "SUPPORT" | "MODERATOR")
            : undefined,
        status: usersStatus !== "all" ? (usersStatus as "active" | "banned") : undefined,
      });
    },
    enabled: activeTab === "users" && isInitialized && isAuthenticated && isBackoffice,
  });

  // Properties - загружаем все данные для клиентской пагинации через TanStack Table
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
            ? (propertiesStatus as "ACTIVE" | "PENDING" | "SOLD" | "ARCHIVED")
            : undefined,
        type:
          propertiesType !== "all"
            ? (propertiesType as "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL")
            : undefined,
        regionId: propertiesRegionId !== "all" ? propertiesRegionId : undefined,
        sortBy: propertiesSortBy as "date-desc" | "date-asc" | "views-desc",
      });
    },
    enabled:
      activeTab === "properties" && isInitialized && isAuthenticated && isBackoffice,
  });

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
    enabled: activeTab === "inbox" && isInitialized && isAuthenticated && isBackoffice,
  });

  // Mutations
  const updateUserRoleMutation = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: "USER" | "PREMIUM" | "ADMIN" | "SUPPORT" | "MODERATOR";
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

  const updatePropertyStatusMutation = useMutation({
    mutationFn: ({
      propertyId,
      status,
      rejectionReason,
    }: {
      propertyId: string;
      status: "ACTIVE" | "PENDING" | "SOLD" | "ARCHIVED";
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

  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ["admin", "chats", chatsType],
    queryFn: async () => {
      return adminService.getChats({
        page: 1,
        limit: 100,
        type: chatsType !== "all" ? (chatsType as "PROPERTY" | "SUPPORT") : undefined,
      });
    },
    enabled: activeTab === "chats" && isInitialized && isAuthenticated && isBackoffice,
  });

  const { data: auditLogsData, isLoading: auditLogsLoading } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: async () => adminService.getAuditLogs({ page: 1, limit: 100 }),
    enabled: activeTab === "logs" && isInitialized && isAuthenticated && isBackoffice,
  });

  const { data: regions = [] } = useQuery({
    queryKey: ["regions"],
    queryFn: () => regionsService.getRegions(),
    enabled:
      activeTab === "properties" && isInitialized && isAuthenticated && isBackoffice,
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

  useEffect(() => {
    // Ждём инициализации store перед редиректом
    if (!isInitialized) return;

    if (!isAuthenticated) {
      redirect("/auth/login");
    } else if (!isBackoffice) {
      redirect("/dashboard");
    }
  }, [isAuthenticated, isBackoffice, isInitialized]);

  // Показываем загрузку пока store не инициализирован
  if (!isInitialized) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto' />
          <p className='text-sm text-muted-foreground'>Загрузка...</p>
        </div>
      </div>
    );
  }

  // Не рендерим контент если не админ (редирект произойдёт)
  if (!isAuthenticated || !isBackoffice) {
    return null;
  }

  return (
    <div className='min-h-screen bg-muted/30'>
      <div className='container mx-auto px-4 py-6 sm:py-8 md:py-12'>
        <div className='mb-6 sm:mb-8'>
          <h1 className='text-2xl sm:text-3xl font-bold text-foreground mb-2'>
            Админ панель
          </h1>
          {/* <p className='text-sm sm:text-base text-muted-foreground'>
            Управление платформой Дохкар
          </p> */}
        </div>

        {/* Tabs */}
        <div className='flex gap-2 mb-6 border-b overflow-x-auto'>
          <div className='flex gap-2 min-w-max'>
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              onClick={() => setActiveTab("overview")}
              className='min-h-[44px] whitespace-nowrap'
            >
              Обзор
            </Button>
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              onClick={() => setActiveTab("users")}
              className='min-h-[44px] whitespace-nowrap'
            >
              Пользователи
            </Button>
            <Button
              variant={activeTab === "properties" ? "default" : "ghost"}
              onClick={() => setActiveTab("properties")}
              className='min-h-[44px] whitespace-nowrap'
            >
              Объявления
            </Button>
            <Button
              variant={activeTab === "inbox" ? "default" : "ghost"}
              onClick={() => setActiveTab("inbox")}
              className='min-h-[44px] whitespace-nowrap'
            >
              Входящие
            </Button>
            <Button
              variant={activeTab === "chats" ? "default" : "ghost"}
              onClick={() => setActiveTab("chats")}
              className='min-h-[44px] whitespace-nowrap'
            >
              Чаты
            </Button>
            <Button
              variant={activeTab === "logs" ? "default" : "ghost"}
              onClick={() => setActiveTab("logs")}
              className='min-h-[44px] whitespace-nowrap'
            >
              Логи
            </Button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className='space-y-6'>
            {statsLoading ? (
              <div className='text-center py-12'>Загрузка статистики...</div>
            ) : statistics ? (
              <>
                {/* Stats Cards */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                  <Card className='border-primary/20'>
                    <CardContent className='p-4 sm:p-6'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-sm text-muted-foreground mb-1'>
                            Всего пользователей
                          </p>
                          <p className='text-2xl sm:text-3xl font-bold'>
                            {statistics.overview.totalUsers}
                          </p>
                        </div>
                        <Users className='w-8 h-8 text-primary' />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className='border-primary/20'>
                    <CardContent className='p-4 sm:p-6'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-sm text-muted-foreground mb-1'>
                            Всего объявлений
                          </p>
                          <p className='text-2xl sm:text-3xl font-bold'>
                            {statistics.overview.totalProperties}
                          </p>
                        </div>
                        <Home className='w-8 h-8 text-primary' />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className='border-primary/20'>
                    <CardContent className='p-4 sm:p-6'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-sm text-muted-foreground mb-1'>
                            Активных объявлений
                          </p>
                          <p className='text-2xl sm:text-3xl font-bold'>
                            {statistics.overview.activeProperties}
                          </p>
                        </div>
                        <CheckCircle2 className='w-8 h-8 text-green-500' />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className='border-primary/20'>
                    <CardContent className='p-4 sm:p-6'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-sm text-muted-foreground mb-1'>
                            На модерации
                          </p>
                          <p className='text-2xl sm:text-3xl font-bold'>
                            {statistics.overview.pendingProperties ?? 0}
                          </p>
                        </div>
                        <Clock className='w-8 h-8 text-yellow-500' />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className='border-primary/20'>
                    <CardContent className='p-4 sm:p-6'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-sm text-muted-foreground mb-1'>
                            Заблокированных
                          </p>
                          <p className='text-2xl sm:text-3xl font-bold'>
                            {statistics.overview.blockedUsersCount ?? 0}
                          </p>
                        </div>
                        <Ban className='w-8 h-8 text-destructive' />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className='border-primary/20'>
                    <CardContent className='p-4 sm:p-6'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-sm text-muted-foreground mb-1'>
                            Новых за сегодня
                          </p>
                          <p className='text-2xl sm:text-3xl font-bold'>
                            {(statistics.overview.newUsersToday ?? 0) +
                              (statistics.overview.newPropertiesToday ?? 0)}
                          </p>
                        </div>
                        <AlertCircle className='w-8 h-8 text-primary' />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className='border-primary/20'>
                    <CardContent className='p-4 sm:p-6'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-sm text-muted-foreground mb-1'>
                            Новых за неделю
                          </p>
                          <p className='text-2xl sm:text-3xl font-bold'>
                            {(statistics.overview.newUsersThisWeek ?? 0) +
                              (statistics.overview.newPropertiesThisWeek ?? 0)}
                          </p>
                        </div>
                        <Clock className='w-8 h-8 text-primary' />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className='border-primary/20'>
                    <CardContent className='p-4 sm:p-6'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-sm text-muted-foreground mb-1'>
                            Активных чатов
                          </p>
                          <p className='text-2xl sm:text-3xl font-bold'>
                            {statistics.overview.activeChatsCount ?? 0}
                          </p>
                        </div>
                        <MessageSquare className='w-8 h-8 text-primary' />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className='border-primary/20'>
                    <CardContent className='p-4 sm:p-6'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-sm text-muted-foreground mb-1'>
                            Всего просмотров
                          </p>
                          <p className='text-2xl sm:text-3xl font-bold'>
                            {(statistics.overview.totalViews ?? 0).toLocaleString()}
                          </p>
                        </div>
                        <Eye className='w-8 h-8 text-primary' />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts — загружаются лениво (Recharts) */}
                <AdminOverviewCharts statistics={statistics} />
              </>
            ) : null}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
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
                        <SelectItem value='SUPPORT'>SUPPORT</SelectItem>
                        <SelectItem value='MODERATOR'>MODERATOR</SelectItem>
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
        )}

        {/* Properties Tab */}
        {activeTab === "properties" && (
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
                    <Select
                      value={propertiesRegionId}
                      onValueChange={setPropertiesRegionId}
                    >
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
                    (propertyId, status) =>
                      setPropertyStatusDialog({ propertyId, status }),
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
        )}

        {/* Inbox Tab */}
        {activeTab === "inbox" && (
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
        )}

        {/* Chats Tab */}
        {activeTab === "chats" && (
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
                              {chat.isArchived && (
                                <Badge variant='secondary'>Архив</Badge>
                              )}
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
        )}

        {/* Audit Logs Tab */}
        {activeTab === "logs" && (
          <div className='space-y-6'>
            <Card className='border-primary/20'>
              <CardHeader>
                <CardTitle>Логи действий</CardTitle>
              </CardHeader>
              <CardContent>
                {auditLogsLoading ? (
                  <div className='text-sm text-muted-foreground'>Загрузка...</div>
                ) : !auditLogsData?.data?.length ? (
                  <div className='text-sm text-muted-foreground'>Нет записей</div>
                ) : (
                  <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                      <thead>
                        <tr className='border-b'>
                          <th className='text-left py-2 px-2'>Когда</th>
                          <th className='text-left py-2 px-2'>Кто</th>
                          <th className='text-left py-2 px-2'>Действие</th>
                          <th className='text-left py-2 px-2'>Сущность</th>
                          <th className='text-left py-2 px-2'>ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogsData.data.map(
                          (log: import("@/services/admin.service").AuditLogEntry) => (
                            <tr key={log.id} className='border-b'>
                              <td className='py-2 px-2 text-muted-foreground'>
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className='py-2 px-2'>
                                {log.user?.name || log.user?.email || log.userId}
                              </td>
                              <td className='py-2 px-2'>{log.action}</td>
                              <td className='py-2 px-2'>{log.entityType}</td>
                              <td className='py-2 px-2 font-mono text-xs'>
                                {log.entityId ?? "—"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
