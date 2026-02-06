/**
 * Константы для системы тем.
 * Binary model: light | dark. Хранится в cookie для SSR и устранения FOUC.
 */
export const THEME_COOKIE_NAME = "theme";
export const THEME_COOKIE_MAX_AGE = 31536000; // 1 год в секундах

export type ThemeValue = "light" | "dark";
