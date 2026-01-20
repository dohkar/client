"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores";
import { authService } from "@/services/auth.service";
import { cookieStorage } from "@/lib/cookie-storage";
import { Spinner } from "@/components/ui/spinner";
import { ROUTES } from "@/constants";

function LoadingState() {
  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center'>
        <Spinner className='w-8 h-8 mx-auto mb-4' />
        <p className='text-muted-foreground'>Авторизация...</p>
      </div>
    </div>
  );
}

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Защита от двойного вызова в Strict Mode
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const handleCallback = async () => {
      try {
        // Получаем токены из URL параметров (от OAuth callback)
        const accessToken = searchParams.get("access_token");
        const refreshToken = searchParams.get("refresh_token");

        // Если есть токены в URL, сохраняем их в cookies
        if (accessToken && refreshToken) {
          cookieStorage.saveTokens(accessToken, refreshToken);
          
          // Очищаем URL от токенов (безопасность)
          window.history.replaceState({}, "", "/auth/callback");
        }

        // Проверяем что токены есть (либо из URL, либо уже в cookies)
        if (!cookieStorage.getAccessToken()) {
          router.push(ROUTES.login);
          return;
        }

        // Теперь получаем данные пользователя
        const userResponse = await authService.getCurrentUser();
        if (userResponse) {
          const user = {
            id: userResponse.id,
            name: userResponse.name,
            email: userResponse.email,
            phone: userResponse.phone,
            avatar: userResponse.avatar,
            isPremium: userResponse.isPremium,
            role: userResponse.role as "user" | "premium" | "admin",
            createdAt: userResponse.createdAt,
          };
          setUser(user);
          useAuthStore.setState({ isInitialized: true, isAuthenticated: true });
          router.push(ROUTES.dashboard);
        } else {
          router.push(ROUTES.login);
        }
      } catch (error) {
        // Игнорируем AbortError - это нормально при размонтировании компонента
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("OAuth callback error:", error);
        router.push(ROUTES.login);
      }
    };

    void handleCallback();
  }, [router, setUser, searchParams]);

  return <LoadingState />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuthCallbackHandler />
    </Suspense>
  );
}
