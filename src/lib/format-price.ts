/**
 * Парсит строку ввода цены → число или null (только цифры).
 */
export function parsePriceDigits(val: string): number | null {
  const digits = val.replace(/\s/g, "").replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isNaN(n) || n < 0 ? null : n;
}

/**
 * Компактный формат для лейблов фильтров (как на Авито):
 * 232323 → "232,3 тыс."
 * 2321323 → "2,3 млн"
 */
export function formatPriceCompact(n: number): string {
  if (n >= 1_000_000_000) {
    return (
      (n / 1_000_000_000).toLocaleString("ru-RU", { maximumFractionDigits: 1 }) + " млрд"
    );
  }
  if (n >= 1_000_000) {
    return (n / 1_000_000).toLocaleString("ru-RU", { maximumFractionDigits: 1 }) + " млн";
  }
  if (n >= 1_000) {
    return (n / 1_000).toLocaleString("ru-RU", { maximumFractionDigits: 1 }) + " тыс.";
  }
  return n.toLocaleString("ru-RU");
}
