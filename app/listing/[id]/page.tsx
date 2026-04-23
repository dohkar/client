"use client";

import { useEffect, useMemo, useRef } from "react";
import { useParams, notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { listingsService } from "@/services/listings.service";
import { analyticsService } from "@/services/analytics.service";
import { pushListingToViewHistory } from "@/lib/history/view-history-helpers";
import { queryKeys } from "@/lib/react-query/query-keys";
import { RealEstateListingDetail } from "@/components/features/listing-detail/real-estate-listing-detail";
import { ListingPageSkeleton } from "@/components/features/listing-detail/listing-page-skeleton";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractIdFromSegment(segment: string | undefined): string | undefined {
  if (!segment?.trim()) return undefined;
  const s = segment.trim();
  if (UUID_REGEX.test(s)) return s;
  if (s.length > 36 && s[36] === "-" && UUID_REGEX.test(s.slice(0, 36))) {
    return s.slice(0, 36);
  }
  return s;
}

export default function ListingPage() {
  const params = useParams();

  const listingId = useMemo(
    () => extractIdFromSegment(typeof params.id === "string" ? params.id : undefined),
    [params.id]
  );

  const {
    data: listing,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.listings.detail(listingId ?? ""),
    queryFn: () => listingsService.getListingById(listingId!),
    enabled: !!listingId,
    staleTime: 30_000,
  });

  const viewRecordedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!listingId || !listing) return;
    if (viewRecordedRef.current === listingId) return;
    viewRecordedRef.current = listingId;
    void analyticsService.recordView(listingId);
    pushListingToViewHistory(listing);
  }, [listingId, listing]);

  if (isLoading) {
    return <ListingPageSkeleton />;
  }

  if (!isLoading && (error || !listing)) {
    notFound();
  }

  const listingData = listing!;
  if (!listingData.realEstate) {
    notFound();
  }

  return <RealEstateListingDetail listing={listingData} />;
}
