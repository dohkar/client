"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className='container mx-auto px-4 py-12'>
      <div className='max-w-2xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold mb-2'>Настройки</h1>
          <p className='text-muted-foreground'>
            Управляйте настройками аккаунта
          </p>
        </div>

        <Card className='border-primary/20'>
          <CardHeader>
            <CardTitle>Уведомления</CardTitle>
            <CardDescription>Настройте уведомления</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              Настройки уведомлений будут доступны в будущих обновлениях
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
