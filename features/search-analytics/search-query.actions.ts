"use server";

import { connectToDatabase } from "@/lib/db/mongoose";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { SearchQueryModel } from "@/features/search-analytics/search-query.model";

const MIN_QUERY_LENGTH = 2;

/** Records a search hit for the "Popular Searches" feature — called from the /search page render, so it only counts committed searches (not every keystroke of a live-typing dropdown). `resultCount`, when passed, also tallies zeroResultCount for getZeroResultSearchInsights. Silently no-ops on very short queries and swallows errors, since this is a nice-to-have analytics signal, not something that should ever break the search page. */
export async function logSearchQuery(
  rawQuery: string,
  resultCount?: number,
): Promise<void> {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < MIN_QUERY_LENGTH) return;

  try {
    await connectToDatabase();
    await SearchQueryModel.findOneAndUpdate(
      { tenantId: DEFAULT_TENANT_ID, query },
      {
        $inc: {
          count: 1,
          ...(resultCount === 0 ? { zeroResultCount: 1 } : {}),
        },
        $set: { lastSearchedAt: new Date() },
      },
      { upsert: true },
    );
  } catch {
    // Best-effort — a logging failure should never surface to the user.
  }
}

export interface PopularSearch {
  query: string;
  count: number;
}

/** Top N search terms by hit count, for the search dropdown's quick-navigation pills. */
export async function getPopularSearches(limit = 5): Promise<PopularSearch[]> {
  await connectToDatabase();
  const docs = await SearchQueryModel.find({ tenantId: DEFAULT_TENANT_ID })
    .sort({ count: -1 })
    .limit(limit)
    .select("query count")
    .lean();
  return docs.map((doc) => ({ query: doc.query, count: doc.count }));
}

/** Top N search terms that most often return nothing — for the admin analytics dashboard's "what customers can't find" signal. */
export async function getZeroResultSearches(limit = 5): Promise<PopularSearch[]> {
  await connectToDatabase();
  const docs = await SearchQueryModel.find({
    tenantId: DEFAULT_TENANT_ID,
    zeroResultCount: { $gt: 0 },
  })
    .sort({ zeroResultCount: -1 })
    .limit(limit)
    .select("query zeroResultCount")
    .lean();
  return docs.map((doc) => ({ query: doc.query, count: doc.zeroResultCount }));
}
