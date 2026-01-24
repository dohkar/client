"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import {
  ProfileHeader,
  ProfileForm,
  AccountDetailsCard,
  PremiumCtaCard,
  ProfilePageSkeleton,
} from "@/components/features/profile";

export default function ProfilePage() {
  const {
    currentUser,
    isLoading,
    isError,
    refetch,
    isDirty,
    changedFieldsCount,
    onSubmit,
    onReset,
    isSubmitting,
    displayAvatarUrl,
    isAvatarUploading,
    fileInputRef,
    handleAvatarSelect,
    handleAvatarClick,
  } = useProfile();

  // Состояние загрузки — показываем skeleton с анимацией
  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  // Состояние ошибки
  if (isError || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <div>
              <h3 className="font-semibold">Ошибка загрузки</h3>
              <p className="text-sm text-muted-foreground">
                Не удалось загрузить данные профиля
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 px-1 md:px-4 md:py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Card */}
        <ProfileHeader 
          user={{
            id: currentUser.id,
            name: currentUser.name ?? null,
            email: currentUser.email ?? null,
            avatar: currentUser.avatar ?? null,
            role: currentUser.role,
            isPremium: currentUser.isPremium,
            createdAt: currentUser.createdAt,
          }} 
          displayAvatarUrl={displayAvatarUrl} 
        />

        {/* Main Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Sidebar, DESKTOP ONLY */}
          <div className="space-y-6 order-1 lg:order-2 hidden lg:block">
            <AccountDetailsCard isPremium={currentUser.isPremium} />
            {!currentUser.isPremium && <PremiumCtaCard />}
          </div>

          {/* Form Card */}
          <div className="order-2 lg:order-1 lg:col-span-2">
            <ProfileForm
              user={{
                name: currentUser.name ?? null,
                email: currentUser.email ?? null,
                phone: currentUser.phone ?? null,
                avatar: currentUser.avatar ?? null,
              }}
              displayAvatarUrl={displayAvatarUrl}
              isAvatarUploading={isAvatarUploading}
              onAvatarClick={handleAvatarClick}
              onSubmit={onSubmit}
              onReset={onReset}
              isDirty={isDirty}
              changedFieldsCount={changedFieldsCount}
              isSubmitting={isSubmitting}
            />
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </div>

          {/* Sidebar, MOBILE ONLY */}
          <div className="space-y-6 order-3 lg:hidden mt-4">
            <AccountDetailsCard isPremium={currentUser.isPremium} />
            {!currentUser.isPremium && <PremiumCtaCard />}
          </div>
        </div>
      </div>
    </div>
  );
}
