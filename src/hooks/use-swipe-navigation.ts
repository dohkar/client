import { useRef, useEffect } from "react";

type SwipeNavigationOptions = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number; // px
};

export function useSwipeNavigation(
  ref: React.RefObject<HTMLElement> | null,
  options: SwipeNavigationOptions = {}
) {
  const { onSwipeLeft, onSwipeRight, minSwipeDistance = 50 } = options;

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const target = ref?.current;
    if (!target) return;

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      touchStartX.current = e.touches[0].clientX;
      touchEndX.current = null;
    }

    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      touchEndX.current = e.touches[0].clientX;
    }

    function handleTouchEnd() {
      if (touchStartX.current !== null && touchEndX.current !== null) {
        const deltaX = touchEndX.current - touchStartX.current;
        if (Math.abs(deltaX) >= minSwipeDistance) {
          if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          }
        }
      }
      touchStartX.current = null;
      touchEndX.current = null;
    }

    target.addEventListener("touchstart", handleTouchStart, { passive: true });
    target.addEventListener("touchmove", handleTouchMove, { passive: true });
    target.addEventListener("touchend", handleTouchEnd);

    return () => {
      target.removeEventListener("touchstart", handleTouchStart);
      target.removeEventListener("touchmove", handleTouchMove);
      target.removeEventListener("touchend", handleTouchEnd);
    };
  }, [ref, onSwipeLeft, onSwipeRight, minSwipeDistance]);
}
