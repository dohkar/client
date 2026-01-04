/**
 * Форматирует дату в читаемый формат
 * @param date - дата для форматирования
 * @param locale - локаль (по умолчанию 'ru-RU')
 * @param options - опции форматирования
 * @returns отформатированная строка даты
 */
export function formatDate(
  date: Date | string | null | undefined,
  locale = "ru-RU",
  options?: {
    relative?: boolean; // Показывать относительное время (сегодня, вчера, X дней назад)
    includeTime?: boolean; // Включать время
    short?: boolean; // Короткий формат (только день и месяц)
  }
): string {
  if (!date) return "Не указано";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Проверка на валидность даты
  if (isNaN(dateObj.getTime())) return "Неверная дата";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const diffTime = today.getTime() - dateOnly.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Относительное время
  if (options?.relative) {
    if (diffDays === 0) {
      return options.includeTime
        ? `Сегодня, ${dateObj.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`
        : "Сегодня";
    } else if (diffDays === 1) {
      return options.includeTime
        ? `Вчера, ${dateObj.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`
        : "Вчера";
    } else if (diffDays === 2) {
      return "2 дня назад";
    } else if (diffDays > 2 && diffDays <= 7) {
      return `${diffDays} дней назад`;
    } else if (diffDays > 7 && diffDays <= 14) {
      return "Неделю назад";
    } else if (diffDays > 14 && diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? "неделю" : weeks < 5 ? "недели" : "недель"} назад`;
    } else if (diffDays > 30 && diffDays <= 365) {
      // Для дат старше 30 дней, но меньше года - показываем месяцы
      const months = Math.floor(diffDays / 30);
      if (months === 1) {
        return "Месяц назад";
      } else if (months < 5) {
        return `${months} месяца назад`;
      } else {
        return `${months} месяцев назад`;
      }
    } else if (diffDays > 365) {
      // Для дат старше года - показываем годы
      const years = Math.floor(diffDays / 365);
      if (years === 1) {
        return "Год назад";
      } else if (years < 5) {
        return `${years} года назад`;
      } else {
        return `${years} лет назад`;
      }
    }
    // Если diffDays отрицательный (дата в будущем), возвращаем относительный формат
    if (diffDays < 0) {
      const futureDays = Math.abs(diffDays);
      if (futureDays === 1) {
        return "Завтра";
      } else if (futureDays <= 7) {
        return `Через ${futureDays} ${futureDays < 5 ? "дня" : "дней"}`;
      } else {
        // Для дат в будущем дальше недели - возвращаем полный формат
        // (но это не должно происходить в нормальных случаях)
      }
    }
  }

  // Полный формат
  if (options?.short) {
    return dateObj.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
    });
  }

  const dateString = dateObj.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (options?.includeTime) {
    const timeString = dateObj.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateString}, ${timeString}`;
  }

  return dateString;
}

/**
 * Форматирует дату и время
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  locale = "ru-RU",
  relative = true
): string {
  return formatDate(date, locale, { relative, includeTime: true });
}

/**
 * Форматирует дату в коротком формате
 */
export function formatDateShort(
  date: Date | string | null | undefined,
  locale = "ru-RU"
): string {
  return formatDate(date, locale, { short: true });
}

/**
 * Форматирует число как валюту
 * @param amount - сумма
 * @param currency - код валюты (по умолчанию 'RUB')
 * @param locale - локаль (по умолчанию 'ru-RU')
 * @returns отформатированная строка валюты
 */
export function formatCurrency(
  amount: number,
  currency: "RUB" | "USD" = "RUB",
  locale = "ru-RU"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Форматирует цену (алиас для formatCurrency)
 */
export const formatPrice = formatCurrency;

/**
 * Обрезает текст до заданной длины
 * @param text - текст для обрезки
 * @param maxLength - максимальная длина
 * @returns обрезанный текст
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
