"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores";
import { authService } from "@/services/auth.service";
import { cookieStorage } from "@/lib/cookie-storage";
import { Spinner } from "@/components/ui/spinner";
import { ROUTES } from "@/constants";
import { toast } from "sonner";
import type { User } from "@/types";

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner className="w-8 h-8 mx-auto mb-4" />
        <p className="text-muted-foreground">Авторизация...</p>
      </div>
    </div>
  );
}

function mapUserResponseToUser(userResponse: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isPremium: boolean;
  role: string;
  createdAt: string;
}): User {
  return {
    id: userResponse.id,
    name: userResponse.name,
    email: userResponse.email,
    phone: userResponse.phone,
    avatar: userResponse.avatar,
    isPremium: userResponse.isPremium,
    role: userResponse.role as User["role"],
    createdAt: userResponse.createdAt,
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

        if (linked === "google" || linked === "yandex") {
          const providerName = linked === "google" ? "Google" : "Яндекс";
          toast.success(`${providerName} привязан к аккаунту`);
          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", "/auth/callback");
          }
          const isPopup = !!window.opener;
          void useAuthStore.getState().checkAuth().then(async () => {
            const userResponse = await authService.getCurrentUser();
            if (userResponse) {
              const user = mapUserResponseToUser(userResponse);
              useAuthStore.getState().setUser(user);
            }
            if (isPopup && window.opener) {
              const u = useAuthStore.getState().user;
              const providerParam = searchParams.get("linked");
              if (u && (providerParam === "google" || providerParam === "yandex")) {
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

        const accessToken = searchParams.get("access_token");
        const refreshToken = searchParams.get("refresh_token");

        if (accessToken && refreshToken) {
          cookieStorage.saveTokens(accessToken, refreshToken);
          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", "/auth/callback");
          }
        }

        if (!cookieStorage.getAccessToken()) {
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
        const message =
          error instanceof Error ? error.message : "Ошибка авторизации";
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
