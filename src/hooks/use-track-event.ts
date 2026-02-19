"use client";

import { useCallback, useRef } from "react";
import { useAuthStore } from "@/stores";
import { getSessionId } from "@/lib/session";
import {
  recommendationsService,
  type TrackEventDto,
} from "@/services/recommendations.service";

export function useTrackEvent() {
  const user = useAuthStore((state) => state.user);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const track = useCallback(
    (
      eventType: TrackEventDto["eventType"],
      propertyId?: string,
      metadata?: Record<string, any>
    ) => {
      if (typeof window === "undefined") return;
      if (/bot|crawler|spider|headless/i.test(navigator.userAgent)) return;

      const doTrack = () => {
        recommendationsService
          .trackEvent({
            eventType,
            propertyId,
            sessionId: getSessionId(),
            metadata,
          })
          .catch(() => {});
      };

      if (eventType === "VIEW") {
        if (pendingRef.current) clearTimeout(pendingRef.current);
        pendingRef.current = setTimeout(doTrack, 500);
      } else {
        doTrack();
      }
    },
    [user?.id]
  );

  return { track };
}
