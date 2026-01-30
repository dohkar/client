import { format, formatDistanceToNow, isToday, isYesterday, isThisYear } from "date-fns";
import { ru } from "date-fns/locale";

/**
 * Утилиты для форматирования дат и времени в чатах
 */

/**
 * Форматирует дату для группировки сообщений
 * Возвращает "Сегодня", "Вчера" или дату
 */
export function formatDateGroup(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isToday(dateObj)) {
    return "Сегодня";
  }

  if (isYesterday(dateObj)) {
    return "Вчера";
  }

  if (isThisYear(dateObj)) {
    return format(dateObj, "d MMMM", { locale: ru });
  }

  return format(dateObj, "d MMMM yyyy", { locale: ru });
}

/**
 * Форматирует относительное время
 * Возвращает "2м назад", "1ч назад" и т.д.
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: ru,
  });
}

/**
 * Форматирует абсолютное время для tooltip
 * Возвращает "20 января 2024, 10:30"
 */
export function formatAbsoluteTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isToday(dateObj)) {
    return format(dateObj, "HH:mm", { locale: ru });
  }

  if (isThisYear(dateObj)) {
    return format(dateObj, "d MMMM, HH:mm", { locale: ru });
  }

  return format(dateObj, "d MMMM yyyy, HH:mm", { locale: ru });
}
