"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Crown } from "lucide-react";

interface AccountDetailsCardProps {
  isPremium: boolean;
}

export function AccountDetailsCard({ isPremium }: AccountDetailsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Детали аккаунта
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Premium Status */}
        <div className="p-3 rounded-lg bg-muted/50 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5" />
            Premium статус
          </p>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isPremium ? "bg-green-500" : "bg-gray-400"
                }`}
            />
            <p className="text-sm font-medium">
              {isPremium ? "Активен" : "Не активен"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
