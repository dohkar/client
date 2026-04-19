import { notFound, redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractPropertyIdFromSegment(segment: string): string {
  const s = segment.trim();
  if (UUID_REGEX.test(s)) return s;
  if (s.length > 36 && s[36] === "-" && UUID_REGEX.test(s.slice(0, 36))) {
    return s.slice(0, 36);
  }
  return s;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * Старые ссылки `/property/...` ведут на актуальную карточку листинга (по listingId из legacy API).
 */
export default async function PropertyLegacyRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: segment } = await params;
  const propertyId = extractPropertyIdFromSegment(segment);

  const res = await fetch(`${API_URL}/api/properties/${propertyId}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    notFound();
  }

  const json: unknown = await res.json();
  if (!isRecord(json) || json.status !== "success" || !isRecord(json.data)) {
    notFound();
  }

  const data = json.data;
  const listingId = typeof data.listingId === "string" ? data.listingId : null;
  const slug = typeof data.slug === "string" ? data.slug : undefined;

  if (!listingId) {
    notFound();
  }

  redirect(slug ? `/listing/${listingId}-${slug}` : `/listing/${listingId}`);
}
