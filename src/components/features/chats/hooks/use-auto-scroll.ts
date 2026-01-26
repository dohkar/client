import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Хук для автоматического скролла к последнему сообщению
 * Скроллит только если пользователь был внизу списка
 */
export function useAutoScroll<T extends HTMLElement>() {
  const scrollRef = useRef<T>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const isScrollingRef = useRef(false);

  /**
   * Проверяет, находится ли пользователь внизу списка
   */
  const checkIfAtBottom = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return false;

    const threshold = 100; // 100px от низа
    const isAtBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;

    return isAtBottom;
  }, []);

  /**
   * Скроллит к низу списка
   */
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    const element = scrollRef.current;
    if (!element || isScrollingRef.current) return;

    isScrollingRef.current = true;

    element.scrollTo({
      top: element.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });

    // Сбрасываем флаг через небольшую задержку
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 100);
  }, []);

  /**
   * Обработчик скролла
   */
  const handleScroll = useCallback(() => {
    if (isScrollingRef.current) return;

    const isAtBottom = checkIfAtBottom();
    setShouldAutoScroll(isAtBottom);
  }, [checkIfAtBottom]);

  // Следим за скроллом
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener("scroll", handleScroll);

    return () => {
      element.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  return {
    scrollRef,
    shouldAutoScroll,
    scrollToBottom,
    checkIfAtBottom,
  };
}
