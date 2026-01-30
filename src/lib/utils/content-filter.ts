/**
 * Утилиты для фильтрации контента в сообщениях
 */

/**
 * Проверяет, содержит ли текст телефоны или ссылки
 */
export function hasProhibitedContent(text: string): boolean {
  // Регулярные выражения для телефонов
  const phonePatterns = [
    /\+?[78][\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g, // +7 (999) 999-99-99
    /\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g, // 999-999-99-99
    /\d{10,11}/g, // 9999999999
  ];

  // Регулярные выражения для ссылок
  const linkPatterns = [
    /https?:\/\/[^\s]+/gi, // http://example.com
    /www\.[^\s]+/gi, // www.example.com
    /[a-zA-Z0-9-]+\.(com|ru|org|net|info|biz|рф)[^\s]*/gi, // example.com
  ];

  // Проверяем телефоны
  for (const pattern of phonePatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  // Проверяем ссылки
  for (const pattern of linkPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}
