"use server";

import { connectToDatabase } from "@/lib/db/mongoose";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { getServerEnv } from "@/config/env";
import { logger } from "@/lib/logger";
import { GoogleReviewCacheModel } from "@/features/reviews/google-review.model";
import type { GoogleReview } from "@/features/reviews/google-review.types";

const DEFAULT_LIMIT = 4;
// The Places API itself only ever returns up to 5 "most relevant" reviews
// per place — there's no pagination to ask for more.
const REVALIDATE_SECONDS = 60 * 60 * 12;

interface PlacesReviewResult {
  author_name: string;
  profile_photo_url?: string;
  rating: number;
  text: string;
  relative_time_description: string;
  time: number;
}

interface PlacesDetailsResponse {
  status: string;
  result?: { reviews?: PlacesReviewResult[] };
}

async function fetchLiveReviews(
  apiKey: string,
  placeId: string,
): Promise<GoogleReview[]> {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json",
  );
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "reviews");
  url.searchParams.set("reviews_sort", "newest");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`Places API request failed with status ${res.status}`);
  }

  const data = (await res.json()) as PlacesDetailsResponse;
  if (data.status !== "OK") {
    throw new Error(`Places API returned status "${data.status}"`);
  }

  return (data.result?.reviews ?? []).map((r) => ({
    authorName: r.author_name,
    profilePhotoUrl: r.profile_photo_url,
    rating: r.rating,
    text: r.text,
    relativeTimeDescription: r.relative_time_description,
    time: r.time,
  }));
}

/**
 * Real Google Reviews for the Testimonials page, with a durable fallback.
 *
 * Live path: fetches the business's current reviews from the Places API
 * and refreshes the cached copy on success.
 *
 * Fallback path (unset API key/Place ID, a failed request, or a revoked
 * key at any point in the future): reads the last successfully cached
 * batch from MongoDB instead — never throws, never surfaces an error to
 * the page. Returns an empty array only if no live fetch has ever
 * succeeded yet, which the caller treats the same as "no reviews configured"
 * (falls back to the manually-curated Testimonial records).
 */
export async function getGoogleReviews(
  limit = DEFAULT_LIMIT,
): Promise<GoogleReview[]> {
  await connectToDatabase();
  const { GOOGLE_PLACES_API_KEY, GOOGLE_PLACE_ID } = getServerEnv();

  if (GOOGLE_PLACES_API_KEY && GOOGLE_PLACE_ID) {
    try {
      const reviews = await fetchLiveReviews(
        GOOGLE_PLACES_API_KEY,
        GOOGLE_PLACE_ID,
      );
      if (reviews.length > 0) {
        await GoogleReviewCacheModel.findOneAndUpdate(
          { tenantId: DEFAULT_TENANT_ID },
          { reviews, fetchedAt: new Date() },
          { upsert: true },
        );
        return reviews.slice(0, limit);
      }
    } catch (error) {
      logger.error(
        "getGoogleReviews",
        "live Places API fetch failed, falling back to cached reviews",
        { error },
      );
    }
  }

  const cached = await GoogleReviewCacheModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
  }).lean();
  return (cached?.reviews ?? []).slice(0, limit).map((r) => ({
    authorName: r.authorName,
    profilePhotoUrl: r.profilePhotoUrl ?? undefined,
    rating: r.rating,
    text: r.text,
    relativeTimeDescription: r.relativeTimeDescription,
    time: r.time,
  }));
}
