"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores";
import { redirect } from "next/navigation";
import { adminService } from "@/services/admin.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Users, Home, Eye, Search, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/format";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function AdminPage() {
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "properties"
  >("overview");
  const [usersPage, setUsersPage] = useState(1);
  const [propertiesPage, setPropertiesPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState("");
  const [propertiesSearch, setPropertiesSearch] = useState("");
  const [propertiesStatus, setPropertiesStatus] = useState<string>("all");
  const [propertiesType, setPropertiesType] = useState<string>("all");

  // Проверка роли админа (без учёта регистра)
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  // Statistics
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "statistics"],
    queryFn: async () => {
      return adminService.getStatistics();
    },
    enabled: isInitialized && isAuthenticated && isAdmin,
  });

  // Users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users", usersPage, usersSearch],
    queryFn: async () => {
      return adminService.getUsers({
        page: usersPage,
        limit: 10,
        search: usersSearch || undefined,
      });
    },
    enabled: activeTab === "users" && isInitialized && isAuthenticated && isAdmin,
  });

  // Properties
  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: [
      "admin",
      "properties",
      propertiesPage,
      propertiesSearch,
      propertiesStatus,
      propertiesType,
    ],
    queryFn: async () => {
      return adminService.getProperties({
        page: propertiesPage,
        limit: 10,
        search: propertiesSearch || undefined,
        status: propertiesStatus !== "all" ? (propertiesStatus as "ACTIVE" | "PENDING" | "SOLD" | "ARCHIVED") : undefined,
        type: propertiesType !== "all" ? (propertiesType as "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL") : undefined,
      });
    },
    enabled: activeTab === "properties" && isInitialized && isAuthenticated && isAdmin,
  });

  // Mutations
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "USER" | "PREMIUM" | "ADMIN" }) =>
      adminService.updateUserRole(userId, role),
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
    }: {
      propertyId: string;
      status: "ACTIVE" | "PENDING" | "SOLD" | "ARCHIVED";
    }) => adminService.updatePropertyStatus(propertyId, status),
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

  useEffect(() => {
    // Ждём инициализации store перед редиректом
    if (!isInitialized) return;
    
    if (!isAuthenticated) {
      redirect("/auth/login");
    } else if (!isAdmin) {
      redirect("/dashboard");
    }
  }, [isAuthenticated, isAdmin, isInitialized]);

  // Показываем загрузку пока store не инициализирован
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Не рендерим контент если не админ (редирект произойдёт)
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className='min-h-screen bg-muted/30'>
      <div className='container mx-auto px-4 py-6 sm:py-8 md:py-12'>
        <div className='mb-6 sm:mb-8'>
          <h1 className='text-2xl sm:text-3xl font-bold text-foreground mb-2'>
            Админ панель
          </h1>
          <p className='text-sm sm:text-base text-muted-foreground'>
            Управление платформой Дохкар
          </p>
        </div>

        {/* Tabs */}
        <div className='flex gap-2 mb-6 border-b'>
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            onClick={() => setActiveTab("overview")}
            className='min-h-[44px]'
          >
            Обзор
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "ghost"}
            onClick={() => setActiveTab("users")}
            className='min-h-[44px]'
          >
            Пользователи
          </Button>
          <Button
            variant={activeTab === "properties" ? "default" : "ghost"}
            onClick={() => setActiveTab("properties")}
            className='min-h-[44px]'
          >
            Объявления
          </Button>
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
                            Всего просмотров
                          </p>
                          <p className='text-2xl sm:text-3xl font-bold'>
                            {statistics.overview.totalViews.toLocaleString()}
                          </p>
                        </div>
                        <Eye className='w-8 h-8 text-primary' />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  <Card className='border-primary/20'>
                    <CardHeader>
                      <CardTitle>Объявления по типам</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width='100%' height={300}>
                        <PieChart>
                          <Pie
                            data={statistics.propertiesByType}
                            cx='50%'
                            cy='50%'
                            labelLine={false}
                            label={({ type, count }) => `${type}: ${count}`}
                            outerRadius={80}
                            fill='#8884d8'
                            dataKey='count'
                          >
                            {statistics?.propertiesByType?.map((entry: { type: string; count: number }, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className='border-primary/20'>
                    <CardHeader>
                      <CardTitle>Объявления по регионам</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width='100%' height={300}>
                        <BarChart data={statistics.propertiesByRegion}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis dataKey='region' />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey='count' fill='#8884d8' />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card className='border-primary/20'>
                  <CardHeader>
                    <CardTitle>Новые объявления за последние 7 дней</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width='100%' height={300}>
                      <LineChart data={statistics.dailyStats}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='date' />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type='monotone'
                          dataKey='count'
                          stroke='#8884d8'
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className='space-y-6'>
            <Card className='border-primary/20'>
              <CardHeader>
                <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
                  <CardTitle>Пользователи</CardTitle>
                  <div className='flex gap-2 w-full sm:w-auto'>
                    <div className='relative flex-1 sm:flex-initial'>
                      <Search className='absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                      <Input
                        placeholder='Поиск...'
                        value={usersSearch}
                        onChange={(e) => {
                          setUsersSearch(e.target.value);
                          setUsersPage(1);
                        }}
                        className='pl-8 min-h-[44px]'
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className='text-center py-12'>Загрузка...</div>
                ) : usersData ? (
                  <>
                    <div className='overflow-x-auto'>
                      <table className='w-full'>
                        <thead>
                          <tr className='border-b'>
                            <th className='text-left p-2 text-sm font-semibold'>
                              Email
                            </th>
                            <th className='text-left p-2 text-sm font-semibold'>
                              Имя
                            </th>
                            <th className='text-left p-2 text-sm font-semibold'>
                              Роль
                            </th>
                            <th className='text-left p-2 text-sm font-semibold'>
                              Объявлений
                            </th>
                            <th className='text-left p-2 text-sm font-semibold'>
                              Дата регистрации
                            </th>
                            <th className='text-left p-2 text-sm font-semibold'>
                              Действия
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersData?.data?.map((user) => (
                            <tr
                              key={user.id}
                              className='border-b hover:bg-muted/50'
                            >
                              <td className='p-2 text-sm'>{user.email}</td>
                              <td className='p-2 text-sm'>{user.name}</td>
                              <td className='p-2'>
                                <Select
                                  value={user.role}
                                  onValueChange={(value) =>
                                    updateUserRoleMutation.mutate({
                                      userId: user.id,
                                      role: value as "USER" | "PREMIUM" | "ADMIN",
                                    })
                                  }
                                >
                                  <SelectTrigger className='w-32 min-h-[36px]'>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value='USER'>USER</SelectItem>
                                    <SelectItem value='PREMIUM'>
                                      PREMIUM
                                    </SelectItem>
                                    <SelectItem value='ADMIN'>ADMIN</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className='p-2 text-sm'>
                                {/* propertiesCount not in UserResponseDto */}
                                -
                              </td>
                              <td className='p-2 text-sm'>
                                {formatDate(user.createdAt, "ru-RU", { relative: true })}
                              </td>
                              <td className='p-2'>
                                <Button
                                  size='sm'
                                  variant='destructive'
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Удалить пользователя ${user.email}?`
                                      )
                                    ) {
                                      deleteUserMutation.mutate(user.id);
                                    }
                                  }}
                                  disabled={deleteUserMutation.isPending}
                                  className='min-h-[36px]'
                                >
                                  <Trash2 className='w-4 h-4' />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {usersData?.totalPages && usersData.totalPages > 1 && (
                      <div className='mt-4'>
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() =>
                                  setUsersPage((p) => Math.max(1, p - 1))
                                }
                                className={
                                  usersPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                            {Array.from(
                              { length: usersData?.totalPages || 0 },
                              (_, i) => i + 1
                            ).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setUsersPage(page)}
                                  isActive={page === usersPage}
                                  className='cursor-pointer'
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() =>
                                  setUsersPage((p) =>
                                    Math.min(usersData?.totalPages || 1, p + 1)
                                  )
                                }
                                className={
                                  usersPage === (usersData?.totalPages || 1)
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === "properties" && (
          <div className='space-y-6'>
            <Card className='border-primary/20'>
              <CardHeader>
                <div className='flex flex-col gap-4'>
                  <CardTitle>Объявления</CardTitle>
                  <div className='flex flex-col sm:flex-row gap-2'>
                    <div className='relative flex-1'>
                      <Search className='absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                      <Input
                        placeholder='Поиск...'
                        value={propertiesSearch}
                        onChange={(e) => {
                          setPropertiesSearch(e.target.value);
                          setPropertiesPage(1);
                        }}
                        className='pl-8 min-h-[44px]'
                      />
                    </div>
                    <Select
                      value={propertiesStatus}
                      onValueChange={setPropertiesStatus}
                    >
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
                    <Select
                      value={propertiesType}
                      onValueChange={setPropertiesType}
                    >
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {propertiesLoading ? (
                  <div className='text-center py-12'>Загрузка...</div>
                ) : propertiesData ? (
                  <>
                    <div className='overflow-x-auto rounded-lg border border-border'>
                      <table className='w-full'>
                        <thead>
                          <tr className='border-b bg-muted/50'>
                            <th className='text-left p-3 text-sm font-semibold text-foreground'>
                              Название
                            </th>
                            <th className='text-left p-3 text-sm font-semibold text-foreground'>
                              Цена
                            </th>
                            <th className='text-left p-3 text-sm font-semibold text-foreground'>
                              Тип
                            </th>
                            <th className='text-left p-3 text-sm font-semibold text-foreground'>
                              Статус
                            </th>
                            <th className='text-left p-3 text-sm font-semibold text-foreground'>
                              Просмотры
                            </th>
                            <th className='text-left p-3 text-sm font-semibold text-foreground'>
                              Владелец
                            </th>
                            <th className='text-left p-3 text-sm font-semibold text-foreground'>
                              Действия
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {propertiesData?.data?.map((property, index) => (
                            <tr
                              key={property.id}
                              className={`border-b transition-colors ${
                                index % 2 === 0 ? "bg-background" : "bg-muted/30"
                              } hover:bg-muted/70`}
                            >
                              <td className='p-3 text-sm max-w-xs'>
                                <span className='truncate block' title={property.title}>
                                  {property.title}
                                </span>
                              </td>
                              <td className='p-3 text-sm font-medium'>
                                {formatCurrency(
                                  property.price,
                                  (property.currency as "RUB" | "USD") || "RUB"
                                )}
                              </td>
                              <td className='p-3 text-sm'>
                                <Badge variant='outline' className='text-xs'>
                                  {property.type}
                                </Badge>
                              </td>
                              <td className='p-3'>
                                <Select
                                  value={property.status}
                                  onValueChange={(value) =>
                                    updatePropertyStatusMutation.mutate({
                                      propertyId: property.id,
                                      status: value as "ACTIVE" | "PENDING" | "SOLD" | "ARCHIVED",
                                    })
                                  }
                                >
                                  <SelectTrigger className='w-36 min-h-[36px]'>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value='ACTIVE'>
                                      <div className='flex items-center gap-2'>
                                        <div className='w-2 h-2 rounded-full bg-green-500' />
                                        Активное
                                      </div>
                                    </SelectItem>
                                    <SelectItem value='PENDING'>
                                      <div className='flex items-center gap-2'>
                                        <div className='w-2 h-2 rounded-full bg-yellow-500' />
                                        На модерации
                                      </div>
                                    </SelectItem>
                                    <SelectItem value='SOLD'>
                                      <div className='flex items-center gap-2'>
                                        <div className='w-2 h-2 rounded-full bg-blue-500' />
                                        Продано
                                      </div>
                                    </SelectItem>
                                    <SelectItem value='ARCHIVED'>
                                      <div className='flex items-center gap-2'>
                                        <div className='w-2 h-2 rounded-full bg-gray-500' />
                                        Архив
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className='p-3 text-sm text-muted-foreground'>
                                {property.views || 0}
                              </td>
                              <td className='p-3 text-sm text-muted-foreground'>
                                <span className='truncate block max-w-[120px]' title={property.userId}>
                                  {property.userId}
                                </span>
                              </td>
                              <td className='p-3'>
                                <Button
                                  size='sm'
                                  variant='destructive'
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Удалить объявление "${property.title}"?`
                                      )
                                    ) {
                                      deletePropertyMutation.mutate(
                                        property.id
                                      );
                                    }
                                  }}
                                  disabled={deletePropertyMutation.isPending}
                                  className='min-h-[36px]'
                                >
                                  <Trash2 className='w-4 h-4' />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {propertiesData?.totalPages && propertiesData.totalPages > 1 && (
                      <div className='mt-4'>
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() =>
                                  setPropertiesPage((p) => Math.max(1, p - 1))
                                }
                                className={
                                  propertiesPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                            {Array.from(
                              { length: propertiesData?.totalPages || 0 },
                              (_, i) => i + 1
                            ).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setPropertiesPage(page)}
                                  isActive={page === propertiesPage}
                                  className='cursor-pointer'
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() =>
                                  setPropertiesPage((p) =>
                                    Math.min(propertiesData?.totalPages || 1, p + 1)
                                  )
                                }
                                className={
                                  propertiesPage === (propertiesData?.totalPages || 1)
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
