"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/stores/auth.store";

import { useAuthModalStore } from "../model/auth-modal.store";
import type { AuthIntent } from "../model/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  intent?: AuthIntent;
  redirectTo?: string;
  showLoading?: boolean;
}

/**
 * Компонент-обёртка для защиты страниц, требующих авторизации.
 * Если пользователь не авторизован — открывается модалка авторизации или редирект.
 *
 * @example
 * ```tsx
 * export default function CheckoutPage() {
 *   return (
 *     <ProtectedRoute intent={{ type: 'checkout' }}>
 *       <CheckoutContent />
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 */
export function ProtectedRoute({
  children,
  intent,
  redirectTo,
  showLoading = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { open } = useAuthModalStore();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }
      open(intent);
    }
  }, [isAuthenticated, isInitialized, open, intent, redirectTo, router]);

  if (!isInitialized && showLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
