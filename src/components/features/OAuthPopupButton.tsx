"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";
import { ROUTES } from "@/constants";
import {
  isOAuthError,
  isOAuthLinked,
  isOAuthSuccess,
  type OAuthPopupProvider,
} from "@/types/oauth-popup";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-media-query";

const POPUP_WIDTH = 500;
const POPUP_HEIGHT = 600;

function getPopupPosition(): { left: number; top: number } {
  if (typeof window === "undefined") return { left: 0, top: 0 };
  const left = Math.round(
    window.screenX + (window.outerWidth - POPUP_WIDTH) / 2
  );
  const top = Math.round(
    window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2
  );
  return { left, top };
}

const OAUTH_MESSAGE_TYPES = ["oauth:success", "oauth:error", "oauth:linked"] as const;

function getAllowedOrigins(): string[] {
  if (typeof window === "undefined") return [];
  const origins: string[] = [window.location.origin];
  const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN;
  if (appOrigin && appOrigin !== window.location.origin) {
    origins.push(appOrigin);
  }
  return origins;
}

function isValidOAuthMessage(data: unknown): data is { type: string } {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    OAUTH_MESSAGE_TYPES.includes((data as { type: string }).type as (typeof OAUTH_MESSAGE_TYPES)[number])
  );
}

export interface OAuthPopupButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  provider: OAuthPopupProvider;
  label: string;
  icon?: React.ReactNode;
  className?: string;
  onSuccessRedirect?: string;
  /** state для OAuth (например "link" для привязки аккаунта) */
  oauthState?: string;
}

export const OAuthPopupButton = forwardRef<
  HTMLButtonElement,
  OAuthPopupButtonProps
>(function OAuthPopupButton(
  {
    provider,
    label,
    icon,
    className,
    onSuccessRedirect = ROUTES.dashboard,
    disabled = false,
    oauthState,
    ...rest
  },
  ref
) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const listenerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const getOAuthUrl = useCallback(() => {
    return authService.getOAuthUrl(
      provider,
      oauthState ? { state: oauthState } : undefined
    );
  }, [provider, oauthState]);

  const cleanup = useCallback(() => {
    if (listenerRef.current && typeof window !== "undefined") {
      window.removeEventListener("message", listenerRef.current);
      listenerRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    popupRef.current = null;
    completedRef.current = false;
    setIsLoading(false);
  }, []);

  const openOAuthPopup = useCallback(() => {
    if (typeof window === "undefined") return;

    const url = getOAuthUrl();
    const preferRedirect =
      isMobile ||
      (typeof window !== "undefined" && window.innerWidth < 768);

    if (preferRedirect) {
      window.location.href = url;
      return;
    }

    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
      return;
    }

    const { left, top } = getPopupPosition();
    const features = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`;
    const popup = window.open(url, "oauth-popup", features);

    if (!popup) {
      toast.error("Всплывающее окно заблокировано", {
        description: "Разрешите всплывающие окна или войдите в этом окне",
        action: {
          label: "Войти в этом окне",
          onClick: () => {
            window.location.href = url;
          },
        },
      });
      return;
    }

    popupRef.current = popup;
    completedRef.current = false;
    setIsLoading(true);

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== popupRef.current) return;
      const allowedOrigins = getAllowedOrigins();
      if (allowedOrigins.length > 0 && !allowedOrigins.includes(event.origin)) {
        return;
      }
      if (!isValidOAuthMessage(event.data)) return;

      completedRef.current = true;
      cleanup();

      if (isOAuthSuccess(event.data)) {
        setUser(event.data.user);
        useAuthStore.setState({
          isAuthenticated: true,
          isInitialized: true,
          error: null,
        });
        toast.success("Вы успешно вошли в аккаунт");
        void useAuthStore.getState().checkAuth().then(() => {
          if (onSuccessRedirect) {
            router.push(onSuccessRedirect);
          }
        });
        return;
      }

      if (isOAuthLinked(event.data)) {
        setUser(event.data.user);
        useAuthStore.setState({
          isAuthenticated: true,
          isInitialized: true,
          error: null,
        });
        const name = event.data.provider === "google" ? "Google" : "Яндекс";
        toast.success(`${name} привязан к аккаунту`);
        return;
      }

      if (isOAuthError(event.data)) {
        toast.error("Ошибка авторизации", {
          description: event.data.error,
        });
        useAuthStore.getState().setError(event.data.error);
      }
    };

    listenerRef.current = handleMessage;
    window.addEventListener("message", handleMessage);

    pollRef.current = setInterval(() => {
      if (popupRef.current?.closed) {
        if (!completedRef.current) {
          toast.info("Вход отменён", {
            description: "Окно авторизации было закрыто",
          });
        }
        cleanup();
      }
    }, 500);
  }, [
    provider,
    oauthState,
    getOAuthUrl,
    isMobile,
    cleanup,
    setUser,
    onSuccessRedirect,
    router,
  ]);

  useEffect(() => {
    return () => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      cleanup();
    };
  }, [cleanup]);

  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      onClick={openOAuthPopup}
      disabled={disabled || isLoading}
      className={cn(className)}
      aria-label={label}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span
            className="size-5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
          <span className="hidden sm:inline text-sm font-medium">
            Авторизация...
          </span>
        </span>
      ) : (
        <>
          {icon}
          <span className="hidden sm:inline text-sm font-medium">{label}</span>
        </>
      )}
    </button>
  );
});
