"use client";

import type { ReactNode } from "react";
import { useUIStore } from "@/stores";
import { cn } from "@/lib/utils";

/**
 * Main с отступом под MobileBottomNav (+ safe-area).
 * На immersive-экранах (открытый чат) отступ снимается вместе с nav.
 */
export function AppMain({ children }: { children: ReactNode }) {
  const isMobileBottomNavHidden = useUIStore((s) => s.isMobileBottomNavHidden);

  return (
    <main
      className={cn(
        "flex-1 bg-muted/20 min-h-0",
        !isMobileBottomNavHidden && "pb-mobile-nav"
      )}
    >
      {children}
    </main>
  );
}
