import { describe, it, expect } from "vitest";
import {
  API_TYPE_TO_SLUG,
  CATEGORY_MAP,
  API_DEAL_TO_SLUG,
  DEAL_TYPE_MAP,
  API_REGION_TO_SLUG,
  REGION_MAP,
  REGION_NAME_TO_SLUG,
} from "@/lib/url/segments";

describe("segments map symmetry", () => {
  it("API_TYPE_TO_SLUG and CATEGORY_MAP.apiType are in sync", () => {
    // Check that for every API_TYPE_TO_SLUG entry, CATEGORY_MAP has matching .apiType
    for (const [apiType, slug] of Object.entries(API_TYPE_TO_SLUG)) {
      const entry = CATEGORY_MAP[slug as keyof typeof CATEGORY_MAP];
      expect(entry).toBeDefined();
      expect(entry?.apiType).toBe(apiType);
    }
    // Check the reverse: that for every CATEGORY_MAP with .apiType, API_TYPE_TO_SLUG matches the slug
    const categorySlugsWithType = Object.entries(CATEGORY_MAP)
      .filter(([, v]) => v.apiType != null)
      .map(([slug, v]) => [v.apiType, slug] as const);
    for (const [apiType, slug] of categorySlugsWithType) {
      expect(API_TYPE_TO_SLUG[apiType!]).toBe(slug);
    }
  });

  it("API_DEAL_TO_SLUG and DEAL_TYPE_MAP.apiDeal are in sync", () => {
    for (const [apiDeal, slug] of Object.entries(API_DEAL_TO_SLUG)) {
      const entry = DEAL_TYPE_MAP[slug as keyof typeof DEAL_TYPE_MAP];
      expect(entry).toBeDefined();
      expect(entry?.apiDeal).toBe(apiDeal);
    }
    // Check reverse mapping as well
    const dealSlugsWithType = Object.entries(DEAL_TYPE_MAP)
      .filter(([, v]) => v.apiDeal != null)
      .map(([slug, v]) => [v.apiDeal, slug] as const);
    for (const [apiDeal, slug] of dealSlugsWithType) {
      expect(API_DEAL_TO_SLUG[apiDeal!]).toBe(slug);
    }
  });

  it("API_REGION_TO_SLUG and REGION_MAP.apiValue are in sync (excluding 'all')", () => {
    for (const [apiRegion, slug] of Object.entries(API_REGION_TO_SLUG)) {
      const entry = REGION_MAP[slug as keyof typeof REGION_MAP];
      expect(entry).toBeDefined();
      expect(entry?.apiValue).toBe(apiRegion);
    }
    for (const [slug, entry] of Object.entries(REGION_MAP)) {
      if (entry.apiValue == null) continue;
      expect(API_REGION_TO_SLUG[entry.apiValue as keyof typeof API_REGION_TO_SLUG]).toBe(
        slug
      );
    }
    // Ensure all used REGION_MAP slugs are present in REGION_NAME_TO_SLUG
    Object.entries(REGION_MAP).forEach(([slug, { apiValue }]) => {
      if (!apiValue) return; // skip entries without apiValue, e.g. "all"
      const hasMapping = Object.values(REGION_NAME_TO_SLUG).includes(slug);
      expect(hasMapping, `${slug} missing in REGION_NAME_TO_SLUG`).toBe(true);
    });
  });
});
