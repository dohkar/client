import { useEffect, useCallback, useState } from "react";
import type { Message } from "@/types/chat";

/**
 * Хук для desktop notifications через Notification API
 */
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );

  /**
   * Запросить разрешение на уведомления
   */
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  }, []);

  /**
   * Показать уведомление о новом сообщении
   */
  const showNotification = useCallback(
    (title: string, body: string, icon?: string) => {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      // Не показываем уведомления если вкладка активна
      if (!document.hidden) {
        return;
      }

      new Notification(title, {
        body,
        icon: icon || "/chat-icon.png",
        badge: "/chat-icon.png",
        tag: "chat-message", // Группируем уведомления
      });
    },
    []
  );

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: typeof window !== "undefined" && "Notification" in window,
  };
}
