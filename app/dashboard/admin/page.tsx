"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks";
import { useAuthStore } from "@/stores";
import { redirect } from "next/navigation";
import { adminService } from "@/services/admin.service";
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function AdminPage() {
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "properties"
  >("overview");
  const [usersSearch, setUsersSearch] = useState("");
  const [propertiesSearch, setPropertiesSearch] = useState("");
  const [propertiesStatus, setPropertiesStatus] = useState<string>("all");
  const [propertiesType, setPropertiesType] = useState<string>("all");

  const debouncedUsersSearch = useDebounce(usersSearch, 400);
  const debouncedPropertiesSearch = useDebounce(propertiesSearch, 400);

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

  // Users - загружаем все данные для клиентской пагинации через TanStack Table
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users", debouncedUsersSearch],
    queryFn: async () => {
      // Загружаем больше данных для клиентской пагинации
      // В будущем можно переделать на manual pagination для больших объемов
      return adminService.getUsers({
        page: 1,
        limit: 1000, // Временное решение - загружаем много данных
        search: debouncedUsersSearch || undefined,
      });
    },
    enabled: activeTab === "users" && isInitialized && isAuthenticated && isAdmin,
  });

  // Properties - загружаем все данные для клиентской пагинации через TanStack Table
  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: [
      "admin",
      "properties",
      debouncedPropertiesSearch,
      propertiesStatus,
      propertiesType,
    ],
    queryFn: async () => {
      // Загружаем больше данных для клиентской пагинации
      // В будущем можно переделать на manual pagination для больших объемов
      return adminService.getProperties({
        page: 1,
        limit: 1000, // Временное решение - загружаем много данных
        search: debouncedPropertiesSearch || undefined,
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
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
                  <Card className='border-primary/20'>
                    <CardHeader className='pb-3 sm:pb-6'>
                      <CardTitle className='text-base sm:text-lg'>Объявления по типам</CardTitle>
                    </CardHeader>
                    <CardContent className='px-2 sm:px-6'>
                      <ResponsiveContainer width='100%' height={250} className="sm:h-[300px]">
                        <PieChart>
                          <Pie
                            data={statistics.propertiesByType}
                            cx='50%'
                            cy='50%'
                            labelLine={false}
                            label={({ type, count }) => `${type}: ${count}`}
                            outerRadius={60}
                            className="sm:outerRadius-[80px]"
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
                    <CardHeader className='pb-3 sm:pb-6'>
                      <CardTitle className='text-base sm:text-lg'>Объявления по регионам</CardTitle>
                    </CardHeader>
                    <CardContent className='px-2 sm:px-6'>
                      <ResponsiveContainer width='100%' height={250} className="sm:h-[300px]">
                        <BarChart data={statistics.propertiesByRegion}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis
                            dataKey='region'
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            className="text-xs"
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey='count' fill='#8884d8' />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card className='border-primary/20'>
                  <CardHeader className='pb-3 sm:pb-6'>
                    <CardTitle className='text-base sm:text-lg'>Новые объявления за последние 7 дней</CardTitle>
                  </CardHeader>
                  <CardContent className='px-2 sm:px-6'>
                    <ResponsiveContainer width='100%' height={250} className="sm:h-[300px]">
                      <LineChart data={statistics.dailyStats}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis
                          dataKey='date'
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          className="text-xs"
                        />
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
                        placeholder='Поиск по email, имени, роли, телефону...'
                        value={usersSearch}
                        onChange={(e) => {
                          setUsersSearch(e.target.value);
                        }}
                        className='pl-8 min-h-[44px]'
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <UsersDataTable
                  columns={createUserColumns(
                    (userId, role) =>
                      updateUserRoleMutation.mutate({ userId, role }),
                    (userId) => deleteUserMutation.mutate(userId),
                    deleteUserMutation.isPending
                  )}
                  data={(usersData?.data || []) as UserWithCount[]}
                  isLoading={usersLoading}
                  searchValue={debouncedUsersSearch}
                  onSearchChange={setUsersSearch}
                />
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
                <PropertiesDataTable
                  columns={createPropertyColumns(
                    (propertyId, status) =>
                      updatePropertyStatusMutation.mutate({ propertyId, status }),
                    (propertyId) => deletePropertyMutation.mutate(propertyId),
                    deletePropertyMutation.isPending
                  )}
                  data={propertiesData?.data || []}
                  isLoading={propertiesLoading}
                  searchValue={debouncedPropertiesSearch}
                  onSearchChange={setPropertiesSearch}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
