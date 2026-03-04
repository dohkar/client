import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchPageClient } from "@/components/features/search-page-client";
import { SearchParamsDebug } from "@/components/features/SearchParamsDebug";
import {
  CATEGORY_MAP,
  DEAL_TYPE_MAP,
  parseSegments,
  REGION_MAP,
} from "@/lib/url/segments";
import { Suspense } from "react";

interface SegmentDealPageProps {
  params: Promise<{
    region: string;
    category: string;
    dealType: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: SegmentDealPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const regionEntry = REGION_MAP[resolvedParams.region as keyof typeof REGION_MAP];
  const categoryEntry =
    CATEGORY_MAP[resolvedParams.category as keyof typeof CATEGORY_MAP];
  const dealEntry = DEAL_TYPE_MAP[resolvedParams.dealType as keyof typeof DEAL_TYPE_MAP];

  if (!regionEntry || !categoryEntry || !dealEntry) {
    return {};
  }

  const isAllRegions = resolvedParams.region === "all";
  const title = isAllRegions
    ? `Вся недвижимость — ${regionEntry.label} — ${dealEntry.label}`
    : `${categoryEntry.label} в ${regionEntry.label} — ${dealEntry.label}`;

  return { title };
}

export default async function RegionCategoryDealPage({
  params,
  searchParams,
}: SegmentDealPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const parsed = parseSegments(
    resolvedParams.region,
    resolvedParams.category,
    resolvedParams.dealType
  );

  if (!parsed) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <>
        <SearchParamsDebug />
        <SearchPageClient
          params={{
            region: resolvedParams.region,
            category: resolvedParams.category,
            dealType: resolvedParams.dealType,
          }}
          searchParams={resolvedSearchParams}
        />
      </>
    </Suspense>
  );
}
