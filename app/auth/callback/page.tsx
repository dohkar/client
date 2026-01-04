"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { authService } from "@/services/auth.service";
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
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    // Токены теперь устанавливаются через cookies на сервере
    // Просто проверяем авторизацию и получаем пользователя
    authService
      .getCurrentUser()
      .then((response) => {
        if (response.status === "success" && response.data) {
          setUser(response.data);
          // Устанавливаем флаг инициализации
          useAuthStore.setState({ isInitialized: true });
          router.push(ROUTES.dashboard);
        } else {
          router.push(ROUTES.login);
        }
      })
      .catch(() => {
        router.push(ROUTES.login);
      });
  }, [router, setUser]);

  return <LoadingState />;
}

export default function AuthCallbackPage() {
  return <AuthCallbackHandler />;
}
