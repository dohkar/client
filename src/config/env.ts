/**
 * Переменные окружения с валидацией
 */

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Переменная окружения ${key} не установлена`);
  }
  return value;
}

export const env = {
  // API
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",

  // App
  nodeEnv: process.env.NODE_ENV || "development",
  isDev: process.env.NODE_ENV === "development",
  isProd: process.env.NODE_ENV === "production",

  // Добавьте свои переменные окружения здесь
} as const;
