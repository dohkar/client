import { formatPhoneInput as formatPhoneInputFromContact } from "../contact-utils";

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

// ============================================
// Утилиты для работы с телефонными номерами
// ============================================

/**
 * Очищает номер телефона от всех символов кроме цифр и +
 * @param phone - номер телефона
 * @returns очищенный номер
 */
export function cleanPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/[^\d+]/g, "");
}

/**
 * Нормализует номер телефона к формату E.164 (+7XXXXXXXXXX)
 * Поддерживает российские номера в различных форматах
 * @param phone - номер телефона в любом формате
 * @returns нормализованный номер или пустая строка
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  
  // Убираем все кроме цифр
  const digits = phone.replace(/\D/g, "");
  
  if (digits.length === 0) return "";
  
  // Российские номера - приоритетная обработка
  if (digits.length === 11) {
    // 8XXXXXXXXXX → +7XXXXXXXXXX
    if (digits.startsWith("8")) {
      return "+7" + digits.slice(1);
    }
    // 7XXXXXXXXXX → +7XXXXXXXXXX
    if (digits.startsWith("7")) {
      return "+7" + digits.slice(1);
    }
  } else if (digits.length === 10) {
    // 9XXXXXXXXX (без кода страны) → +79XXXXXXXXX
    if (digits.startsWith("9")) {
      return "+7" + digits;
    }
    // Другие 10-значные номера → +7XXXXXXXXXX
    return "+7" + digits;
  } else if (digits.length === 12 && digits.startsWith("7")) {
    // 7XXXXXXXXXXX (иногда встречается с лишней цифрой) → +7XXXXXXXXXX
    return "+7" + digits.slice(1, 12);
  }
  
  // Если номер уже начинается с +, нормализуем
  if (phone.startsWith("+")) {
    const plusDigits = phone.replace(/\D/g, "");
    // Если это российский номер с +7
    if (plusDigits.startsWith("7") && plusDigits.length === 11) {
      return "+" + plusDigits;
    }
    // Если это российский номер с +8 (ошибка)
    if (plusDigits.startsWith("8") && plusDigits.length === 11) {
      return "+7" + plusDigits.slice(1);
    }
    return "+" + plusDigits;
  }
  
  // Для других форматов возвращаем как есть с + (если достаточно цифр)
  return digits.length >= 10 ? "+" + digits : "";
}

/**
 * Форматы отображения телефона
 */
export type PhoneFormat = 
  | "international"  // +7 (999) 123-45-67
  | "national"       // 8 (999) 123-45-67
  | "compact"        // +7 999 123-45-67
  | "digits"         // +79991234567
  | "masked"         // +7 (999) ***-**-67
  | "short";         // ***-45-67

/**
 * Форматирует номер телефона для отображения
 * @param phone - номер телефона
 * @param format - формат отображения
 * @returns отформатированный номер
 */
export function formatPhone(
  phone: string | null | undefined,
  format: PhoneFormat = "international"
): string {
  if (!phone) return "Не указан";
  
  const normalized = normalizePhone(phone);
  if (!normalized) return phone; // Возвращаем исходный если не удалось нормализовать
  
  // Извлекаем цифры без +
  const digits = normalized.replace(/\D/g, "");
  
  // Для российских номеров (11 цифр начиная с 7)
  if (digits.length === 11 && digits.startsWith("7")) {
    const country = digits.slice(0, 1);   // 7
    const code = digits.slice(1, 4);      // 999
    const part1 = digits.slice(4, 7);     // 123
    const part2 = digits.slice(7, 9);     // 45
    const part3 = digits.slice(9, 11);    // 67
    
    switch (format) {
      case "international":
        return `+${country} (${code}) ${part1}-${part2}-${part3}`;
      case "national":
        return `8 (${code}) ${part1}-${part2}-${part3}`;
      case "compact":
        return `+${country} ${code} ${part1}-${part2}-${part3}`;
      case "digits":
        return normalized;
      case "masked":
        return `+${country} (${code}) ***-**-${part3}`;
      case "short":
        return `***-${part2}-${part3}`;
      default:
        return `+${country} (${code}) ${part1}-${part2}-${part3}`;
    }
  }
  
  // Для других номеров - базовое форматирование
  if (digits.length >= 10) {
    const last4 = digits.slice(-4);
    const last2First = last4.slice(0, 2);
    const last2Second = last4.slice(2, 4);
    
    if (format === "masked") {
      return `+${digits.slice(0, -4).replace(/./g, "*")}${last2First}-${last2Second}`;
    }
    if (format === "short") {
      return `***-${last2First}-${last2Second}`;
    }
  }
  
  return normalized;
}

/**
 * Проверяет, является ли строка валидным российским номером телефона
 * @param phone - номер телефона
 * @returns true если номер валиден
 */
export function isValidRussianPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  
  const digits = normalized.replace(/\D/g, "");
  
  // Российский номер: 11 цифр, начинается с 7, код оператора 9XX
  if (digits.length === 11 && digits.startsWith("7")) {
    const operatorCode = digits.slice(1, 2);
    // Мобильные номера начинаются с 9
    // Но есть и стационарные с другими кодами
    return operatorCode === "9" || /^[3-8]/.test(operatorCode);
  }
  
  return false;
}

/**
 * Возвращает href для телефонной ссылки
 * @param phone - номер телефона
 * @returns tel: ссылка
 */
export function getPhoneHref(phone: string | null | undefined): string {
  const normalized = normalizePhone(phone);
  return normalized ? `tel:${normalized}` : "#";
}

/**
 * Возвращает href для WhatsApp
 * @param phone - номер телефона
 * @param message - опциональное сообщение
 * @returns wa.me ссылка
 */
export function getWhatsAppHref(
  phone: string | null | undefined,
  message?: string
): string {
  const normalized = normalizePhone(phone);
  if (!normalized) return "#";
  
  // WhatsApp требует номер без +
  const digits = normalized.replace(/\D/g, "");
  const baseUrl = `https://wa.me/${digits}`;
  
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  
  return baseUrl;
}

/**
 * Маскирует номер телефона для приватности
 * @param phone - номер телефона
 * @param showLast - сколько последних цифр показать (по умолчанию 4)
 * @returns замаскированный номер
 */
export function maskPhone(
  phone: string | null | undefined,
  showLast: number = 4
): string {
  if (!phone) return "Не указан";
  
  const normalized = normalizePhone(phone);
  if (!normalized) return phone;
  
  const digits = normalized.replace(/\D/g, "");
  
  if (digits.length <= showLast) return normalized;
  
  const visible = digits.slice(-showLast);
  const masked = "*".repeat(digits.length - showLast);
  
  // Форматируем красиво
  if (digits.length === 11 && digits.startsWith("7")) {
    return `+7 (***) ***-${visible.slice(0, 2)}-${visible.slice(2, 4)}`;
  }
  
  return `+${masked}${visible}`;
}

/**
 * Форматирует ввод телефона в реальном времени (для input)
 * Использует @/lib/contact-utils для единообразия по проекту
 * @param value - текущее значение
 * @param _previousValue - не используется, оставлен для обратной совместимости
 */
export function formatPhoneInput(value: string, _previousValue?: string): string {
  return formatPhoneInputFromContact(value);
}
