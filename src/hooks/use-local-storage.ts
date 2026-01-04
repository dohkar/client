import { useState } from "react";
import { logger } from "@/lib/utils/logger";

/**
 * Хук для работы с localStorage
 * @param key - ключ для хранения
 * @param initialValue - начальное значение
 * @returns [значение, функция для обновления, функция для удаления]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error("Failed to read from localStorage:", error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      logger.error("Failed to write to localStorage:", error);
    }
  };

  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      logger.error("Failed to remove from localStorage:", error);
    }
  };

  return [storedValue, setValue, removeValue];
}
