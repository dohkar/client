"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { adminService } from "@/services/admin.service";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Home,
  Eye,
  CheckCircle2,
  MessageSquare,
  Ban,
  Clock,
  AlertCircle,
} from "lucide-react";

const AdminOverviewCharts = dynamic(
  () => import("@/components/admin/AdminOverviewCharts"),
  { ssr: false }
);

export default function AdminOverviewPage() {
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "statistics"],
    queryFn: async () => {
      return adminService.getStatistics();
    },
  });

  if (statsLoading) {
    return <div className='text-center py-12'>Загрузка статистики...</div>;
  }

  if (!statistics) {
    return <div className='text-center py-12 text-muted-foreground'>Нет данных</div>;
  }

  return (
    <div className='space-y-6'>
      {/* Stats Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='border-primary/20'>
          <CardContent className='p-4 sm:p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground mb-1'>Всего пользователей</p>
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
                <p className='text-sm text-muted-foreground mb-1'>Всего объявлений</p>
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
                <p className='text-sm text-muted-foreground mb-1'>Активных объявлений</p>
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
                <p className='text-sm text-muted-foreground mb-1'>На модерации</p>
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
                <p className='text-sm text-muted-foreground mb-1'>Заблокированных</p>
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
                <p className='text-sm text-muted-foreground mb-1'>Новых за сегодня</p>
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
                <p className='text-sm text-muted-foreground mb-1'>Новых за неделю</p>
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
                <p className='text-sm text-muted-foreground mb-1'>Активных чатов</p>
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
                <p className='text-sm text-muted-foreground mb-1'>Всего просмотров</p>
                <p className='text-2xl sm:text-3xl font-bold'>
                  {(statistics.overview.totalViews ?? 0).toLocaleString()}
                </p>
              </div>
              <Eye className='w-8 h-8 text-primary' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <AdminOverviewCharts statistics={statistics} />
    </div>
  );
}
