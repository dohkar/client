import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchPageClient } from "@/components/features/search-page-client";
import { SearchParamsDebug } from "@/components/features/SearchParamsDebug";
import {
  CATEGORY_MAP,
  DEAL_SLUG_LABELS,
  parseSegments,
  REGION_MAP,
} from "@/lib/url/segments";
import { Suspense } from "react";

interface SegmentPageProps {
  params: Promise<{
    region: string;
    category: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}
export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateMetadata({ params }: SegmentPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const regionEntry = REGION_MAP[resolvedParams.region as keyof typeof REGION_MAP];
  const categoryEntry =
    CATEGORY_MAP[resolvedParams.category as keyof typeof CATEGORY_MAP];
  const defaultDealLabel = DEAL_SLUG_LABELS.prodam ?? "Продам";

  if (!regionEntry || !categoryEntry) {
    return {};
  }

  const isAllRegions = resolvedParams.region === "all";
  const title = isAllRegions
    ? `Вся недвижимость — ${regionEntry.label}`
    : `${categoryEntry.label} в ${regionEntry.label} — ${defaultDealLabel}`;

  return { title };
}

export default async function RegionCategoryPage({
  params,
  searchParams,
}: SegmentPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const parsed = parseSegments(resolvedParams.region, resolvedParams.category);

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
          }}
          searchParams={resolvedSearchParams}
        />
      </>
    </Suspense>
  );
}
