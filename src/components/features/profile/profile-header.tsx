"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Crown,
  Shield,
  User,
  Mail,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils/format";

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string | null | undefined;
    email: string | null | undefined;
    avatar: string | null | undefined;
    role: string;
    isPremium: boolean;
    createdAt: string;
  };
  displayAvatarUrl?: string;
}

// Конфигурация роли
const getRoleConfig = (role?: string, isPremium?: boolean) => {
  const roleUpper = role?.toUpperCase();
  if (roleUpper === "ADMIN") {
    return {
      icon: Shield,
      label: "Администратор",
      variant: "destructive" as const,
      gradient: "from-red-500/20 to-orange-500/20",
      color: "text-red-500",
    };
  }
  if (roleUpper === "PREMIUM" || isPremium) {
    return {
      icon: Crown,
      label: "Premium",
      variant: "default" as const,
      gradient: "from-amber-500/20 to-yellow-500/20",
      color: "text-amber-500",
    };
  }
  return {
    icon: User,
    label: "Пользователь",
    variant: "secondary" as const,
    gradient: "from-slate-500/20 to-gray-500/20",
    color: "text-muted-foreground",
  };
};

// Получение инициалов
const getInitials = (name?: string | null, email?: string | null) => {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "U";
};

export function ProfileHeader({ user, displayAvatarUrl }: ProfileHeaderProps) {
  const roleConfig = getRoleConfig(user.role, user.isPremium);
  const RoleIcon = roleConfig.icon;

  return (
    <Card className="overflow-hidden">
      <div className={`h-20 sm:h-24 md:h-32 bg-gradient-to-r ${roleConfig.gradient}`} />
      <CardContent className="relative px-2 sm:px-4 pb-6 md:px-6">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-10 sm:-mt-12 md:-mt-16">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 border-4 border-background shadow-xl">
              <AvatarImage
                src={displayAvatarUrl}
                alt={user.name || "Аватар"}
              />
              <AvatarFallback className="text-xl sm:text-2xl md:text-3xl font-semibold bg-muted">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            {user.isPremium && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
                <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left space-y-1 sm:space-y-2 md:pb-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              {user.name || "Имя не указано"}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 sm:gap-x-4 gap-y-2">
              <Badge variant={roleConfig.variant} className="gap-1.5">
                <RoleIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {roleConfig.label}
              </Badge>
              {user.email && (
                <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  {user.email}
                </span>
              )}
            </div>
          </div>

          {/* Registration Date */}
          <div className="flex-col items-end text-right gap-1 text-muted-foreground hidden lg:flex">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <p className="text-xs text-muted-foreground">
                Дата регистрации:
              </p>
            </div>
            <p className="text-sm font-medium">
              {new Date(user.createdAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              <span className="mx-1">•</span>
              {formatDate(user.createdAt, "ru-RU", { relative: true, short: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
