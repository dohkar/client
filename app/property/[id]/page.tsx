import { redirect } from "next/navigation";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Для редиректа и запросов к API: UUID или префикс до «-» в формате uuid-slug. */
function segmentToListingId(segment: string | undefined): string | undefined {
  if (!segment?.trim()) return undefined;
  const s = segment.trim();
  if (UUID_REGEX.test(s)) return s;
  if (s.length > 36 && s[36] === "-" && UUID_REGEX.test(s.slice(0, 36))) {
    return s.slice(0, 36);
  }
  return s;
}

/**
 * Старые ссылки /property/:id → канонический URL листинга.
 */
export default async function LegacyPropertyRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  if (!segmentToListingId(raw)) {
    redirect("/");
  }
  redirect(`/listing/${raw.trim()}`);
}
