"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores";
import { authService } from "@/services/auth.service";
import { accessTokenStorage } from "@/lib/access-token-storage";
import { API_URL } from "@/constants/config";
import { Spinner } from "@/components/ui/spinner";
import { ROUTES } from "@/constants";
import { toast } from "sonner";
import type { User } from "@/types";

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

function mapUserResponseToUser(userResponse: {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  isPremium: boolean;
  role: string;
  provider?: string;
  createdAt: string;
}): User {
  return {
    id: userResponse.id,
    name: userResponse.name,
    email: userResponse.email ?? "",
    phone: userResponse.phone ?? undefined,
    avatar: userResponse.avatar ?? undefined,
    isPremium: userResponse.isPremium,
    role: userResponse.role as User["role"],
    createdAt: userResponse.createdAt,
    ...(userResponse.provider != null && { provider: userResponse.provider as User["provider"] }),
  };
}

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const isPopup = typeof window !== "undefined" && !!window.opener;

    const sendToOpenerAndClose = (
      type: "oauth:success" | "oauth:error",
      payload: { user?: User; error?: string }
    ) => {
      if (typeof window === "undefined" || !window.opener) return;
      window.opener.postMessage({ type, ...payload }, window.location.origin);
      window.close();
    };

    const handleCallback = async () => {
      try {
        const linked = searchParams.get("linked");
        const errorParam = searchParams.get("error");

        if (linked === "google" || linked === "yandex" || linked === "vk") {
          const providerName =
            linked === "google" ? "Google" : linked === "yandex" ? "Яндекс" : "VK";
          toast.success(`${providerName} привязан к аккаунту`);
          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", "/auth/callback");
          }
          const isPopup = !!window.opener;
          void useAuthStore
            .getState()
            .checkAuth()
            .then(async () => {
              const userResponse = await authService.getCurrentUser();
              if (userResponse) {
                const user = mapUserResponseToUser(userResponse);
                useAuthStore.getState().setUser(user);
              }
              if (isPopup && window.opener) {
                const u = useAuthStore.getState().user;
                const providerParam = searchParams.get("linked");
                if (
                  u &&
                  (providerParam === "google" || providerParam === "yandex" || providerParam === "vk")
                ) {
                  window.opener.postMessage(
                    {
                      type: "oauth:linked" as const,
                      user: u,
                      provider: providerParam,
                    },
                    window.location.origin
                  );
                }
                window.close();
              } else {
                router.push(ROUTES.dashboardSettings);
              }
            });
          return;
        }

        if (errorParam === "login_required") {
          toast.error("Войдите в аккаунт, чтобы привязать способ входа");
          router.push(ROUTES.login);
          return;
        }
        if (errorParam === "link_failed") {
          toast.error("Не удалось привязать аккаунт");
          router.push(ROUTES.dashboardSettings);
          return;
        }

        const accessTokenFromUrl = searchParams.get("access_token");
        const refreshTokenFromUrl = searchParams.get("refresh_token");

        if (accessTokenFromUrl && refreshTokenFromUrl) {
          try {
            const response = await fetch(`${API_URL}/api/auth/finalize-oauth`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accessToken: accessTokenFromUrl,
                refreshToken: refreshTokenFromUrl,
              }),
              credentials: "include",
            });
            const json = await response.json().catch(() => ({}));
            const data = json.data ?? json;
            if (response.ok && data?.accessToken) {
              accessTokenStorage.setAccessToken(data.accessToken);
              if (typeof window !== "undefined") {
                window.history.replaceState({}, "", "/auth/callback");
              }
            } else {
              const errMsg =
                data?.message || (response.ok ? "Нет accessToken в ответе" : "Ошибка финализации OAuth");
              if (isPopup) {
                sendToOpenerAndClose("oauth:error", { error: errMsg });
                return;
              }
              toast.error(errMsg);
              router.push(ROUTES.login);
              return;
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Ошибка сети";
            if (isPopup) {
              sendToOpenerAndClose("oauth:error", { error: msg });
              return;
            }
            toast.error(msg);
            router.push(ROUTES.login);
            return;
          }
        }

        if (!accessTokenStorage.getAccessToken()) {
          if (isPopup) {
            sendToOpenerAndClose("oauth:error", {
              error: "Токены не получены",
            });
            return;
          }
          router.push(ROUTES.login);
          return;
        }

        const userResponse = await authService.getCurrentUser();
        if (userResponse) {
          const user = mapUserResponseToUser(userResponse);
          setUser(user);
          useAuthStore.setState({ isInitialized: true, isAuthenticated: true });

          if (isPopup) {
            sendToOpenerAndClose("oauth:success", { user });
            return;
          }
          router.push(ROUTES.dashboard);
        } else {
          if (isPopup) {
            sendToOpenerAndClose("oauth:error", {
              error: "Не удалось получить данные пользователя",
            });
            return;
          }
          router.push(ROUTES.login);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        const message = error instanceof Error ? error.message : "Ошибка авторизации";
        if (isPopup) {
          sendToOpenerAndClose("oauth:error", { error: message });
          return;
        }
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
