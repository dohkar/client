/**
 * Форматирует имя пользователя, убирая "undefined" и лишние пробелы
 */
export function formatUserName(name: string | null | undefined): string {
  if (!name) return "User";

  // Убираем "undefined" из имени и лишние пробелы
  return name.replace(/\s+undefined\s*/gi, " ").trim() || "User";
}
