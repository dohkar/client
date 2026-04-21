"use client";

import { useEffect } from "react";

/**
 * Регистрирует service worker в production (установка PWA, обновления SW).
 * В dev отключено, чтобы не мешать HMR.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
      } catch {
        // Установка как приложения не должна ломать основной сценарий
      }
    };

    void register();
  }, []);

  return null;
}
