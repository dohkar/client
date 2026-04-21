import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { REAL_ESTATE_ONLY_LAUNCH } from "@/constants/config";
import { DEFAULT_SEARCH_REGION } from "@/constants/defaults";
import { REGION_MAP } from "@/lib/url/segments";

const NON_REAL_ESTATE_CATEGORY_SLUGS = new Set(["transport", "elektronika"]);

const USER_REGION_COOKIE = "user_region";

/** Маппинг названий регионов (Vercel geo / ip-api) в slug. Варианты написания. */
const REGION_NAME_TO_SLUG: Record<string, string> = {
  ingushetia: "ingushetiya",
  ingushetiya: "ingushetiya",
  "республика ингушетия": "ingushetiya",
  ингушетия: "ingushetiya",
  chechnya: "chechnya",
  chechen: "chechnya",
  "чеченская республика": "chechnya",
  "республика чечня": "chechnya",
  чечня: "chechnya",
};

function regionNameToSlug(regionName: string | null | undefined): string | null {
  if (!regionName || typeof regionName !== "string") return null;
  const normalized = regionName.trim().toLowerCase();
  if (!normalized) return null;
  const slug = REGION_NAME_TO_SLUG[normalized];
  if (slug) return slug;
  for (const [slugKey, entry] of Object.entries(REGION_MAP)) {
    if (slugKey === "all") continue;
    if (
      entry.label.toLowerCase().includes(normalized) ||
      normalized.includes(entry.label.toLowerCase())
    ) {
      return slugKey;
    }
  }
  return null;
}

async function detectRegionByIp(ip: string): Promise<string> {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=regionName&lang=ru`, {
      next: { revalidate: 3600 },
    });
    const data = (await res.json()) as { regionName?: string };
    return regionNameToSlug(data.regionName) ?? DEFAULT_SEARCH_REGION;
  } catch {
    return DEFAULT_SEARCH_REGION;
  }
}

function getValidUserRegion(cookieValue: string | undefined): string | null {
  if (!cookieValue || cookieValue === "all") return null;
  if (cookieValue in REGION_MAP && cookieValue !== "all") return cookieValue;
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (REAL_ESTATE_ONLY_LAUNCH) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 2) {
      const [regionSlug, categorySlug, ...rest] = segments;
      if (regionSlug in REGION_MAP && NON_REAL_ESTATE_CATEGORY_SLUGS.has(categorySlug)) {
        const url = request.nextUrl.clone();
        const tail = rest.length > 0 ? `/${rest.join("/")}` : "";
        url.pathname = `/${regionSlug}/nedvizhimost${tail}`;
        return NextResponse.redirect(url, 307);
      }
    }
  }

  const response = NextResponse.next();

  let userRegion = getValidUserRegion(request.cookies.get(USER_REGION_COOKIE)?.value);

  if (!userRegion) {
    const geo = (request as NextRequest & { geo?: { region?: string; city?: string } })
      .geo;
    const vercelRegion =
      geo?.region ?? request.headers.get("x-vercel-ip-country-region") ?? null;
    const forwardedFirst = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const realIp = request.headers.get("x-real-ip")?.trim();
    const clientIp = forwardedFirst || realIp || "127.0.0.1";
    userRegion =
      regionNameToSlug(vercelRegion) ?? (await detectRegionByIp(clientIp));

    response.cookies.set(USER_REGION_COOKIE, userRegion, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
