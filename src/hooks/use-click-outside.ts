import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * Хук для обработки клика вне элемента
 * @param handler Функция, вызываемая при клике вне элемента
 * @returns ref, который нужно привязать к DOM-элементу
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void
): MutableRefObject<T | null> {
  const ref = useRef<T | null>(null);
  const handlerRef = useRef(handler);

  // Обновляем ref с актуальным handler при каждом рендере
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;
      if (event.target instanceof Node && !el.contains(event.target)) {
        handlerRef.current();
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("touchstart", handleClickOutside, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
    };
    // Пустой массив зависимостей - эффект выполняется только при монтировании/размонтировании
    // handlerRef.current всегда содержит актуальное значение handler
  }, []);

  return ref;
}
