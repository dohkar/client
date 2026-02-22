/**
 * Baseline checklist для ручной проверки после декомпозиции property/[id].
 * Храним рядом с компонентами, чтобы рефактор не менял поведение незаметно.
 */
export const propertyPageBaselineChecklist = [
  "Header breadcrumbs and back button are visible",
  "Gallery renders image placeholders when no media",
  "Sidebar CTA buttons preserve previous behavior",
  "Map block renders both with and without coordinates",
  "Related properties block still appears on data",
] as const;
