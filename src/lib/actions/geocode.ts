"use server";

import { readRuntimeEnv } from "@/lib/runtime-env";
import {
  resolveBestPlace,
  searchPlaces,
  type GeocodeResult,
} from "@/lib/play-geocode";

async function googleApiKey(): Promise<string | undefined> {
  return (await readRuntimeEnv("GOOGLE_GEOCODING_API_KEY"))?.trim() || undefined;
}

export async function searchPlacesAction(
  query: string,
): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  return searchPlaces(q, { googleApiKey: await googleApiKey() });
}

export async function resolvePlaceAction(
  query: string,
): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (q.length < 2) return null;
  return resolveBestPlace(q, { googleApiKey: await googleApiKey() });
}
