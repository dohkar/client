"use client";

import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLogsPage() {
  const { data: auditLogsData, isLoading: auditLogsLoading } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: async () => adminService.getAuditLogs({ page: 1, limit: 100 }),
  });

  return (
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
  );
}
