import { getZyprusLocations, getZyprusTaxonomyTerms } from "./client";

export type TaxonomyCache = {
  locations?: Map<string, string>; // name → id
  propertyTypes?: Map<string, string>;
  indoorFeatures?: Map<string, string>;
  outdoorFeatures?: Map<string, string>;
  priceModifiers?: Map<string, string>;
  titleDeeds?: Map<string, string>;
  lastUpdated: number;
};

const CACHE_TTL_SECONDS = 3600; // 1 hour in seconds

// In-memory cache
let globalCache: TaxonomyCache = {
  lastUpdated: 0,
};

/**
 * Check if cache is stale (older than TTL)
 */
function isCacheStale(cache: TaxonomyCache): boolean {
  const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;
  return Date.now() - cache.lastUpdated > CACHE_TTL_MS;
}

/**
 * Check if we're in build/static generation phase
 */
function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.VERCEL_ENV === "production-build" ||
    (process.env.NODE_ENV === "production" &&
      typeof window === "undefined" &&
      !process.env.ZYPRUS_CLIENT_ID)
  );
}

/**
 * Refresh all taxonomy data from Zyprus API and store in memory
 */
async function refreshCache(): Promise<TaxonomyCache> {
  // During build time, skip API calls and return empty cache
  if (isBuildTime()) {
    console.log(
      "Build time detected - skipping taxonomy cache refresh (will populate at runtime)"
    );
    return {
      lastUpdated: 0,
    };
  }

  try {
    const locations = await getZyprusLocations();
    const propertyTypes = await getZyprusTaxonomyTerms("property_type");
    const indoorFeatures = await getZyprusTaxonomyTerms(
      "indoor_property_features"
    );
    const outdoorFeatures = await getZyprusTaxonomyTerms(
      "outdoor_property_features"
    );
    const priceModifiers = await getZyprusTaxonomyTerms("price_modifier");
    const titleDeeds = await getZyprusTaxonomyTerms("title_deed");

    const newCache: TaxonomyCache = {
      locations: new Map(
        locations.map((loc: any) => [
          loc.attributes.title.toLowerCase(),
          loc.id,
        ])
      ),
      propertyTypes: new Map(
        propertyTypes.map((type: any) => [
          type.attributes.name.toLowerCase(),
          type.id,
        ])
      ),
      indoorFeatures: new Map(
        indoorFeatures.map((feature: any) => [
          feature.attributes.name.toLowerCase(),
          feature.id,
        ])
      ),
      outdoorFeatures: new Map(
        outdoorFeatures.map((feature: any) => [
          feature.attributes.name.toLowerCase(),
          feature.id,
        ])
      ),
      priceModifiers: new Map(
        priceModifiers.map((modifier: any) => [
          modifier.attributes.name.toLowerCase(),
          modifier.id,
        ])
      ),
      titleDeeds: new Map(
        titleDeeds.map((deed: any) => [
          deed.attributes.name.toLowerCase(),
          deed.id,
        ])
      ),
      lastUpdated: Date.now(),
    };

    // Update global cache
    globalCache = newCache;

    return newCache;
  } catch (error) {
    console.error("Failed to refresh taxonomy cache from Zyprus API:", error);

    // During build time, return empty cache instead of retrying
    if (isBuildTime()) {
      console.log("Build time - returning empty cache after API failure");
      return {
        lastUpdated: 0,
      };
    }

    // Return existing cache if available
    if (globalCache.lastUpdated > 0) {
      return globalCache;
    }

    // Last resort: empty cache
    return {
      lastUpdated: 0,
    };
  }
}

/**
 * Get cached taxonomy data, refresh if stale
 */
export async function getCache(): Promise<TaxonomyCache> {
  // During build time, return empty cache immediately
  if (isBuildTime()) {
    console.log("Build time - returning empty taxonomy cache");
    return {
      lastUpdated: 0,
    };
  }

  // Check if stale
  if (isCacheStale(globalCache)) {
    // Refresh in background if we have data, otherwise wait
    if (globalCache.lastUpdated > 0) {
      refreshCache().catch((err) =>
        console.error("Background cache refresh failed:", err)
      );
      return globalCache;
    }
    return await refreshCache();
  }

  return globalCache;
}

/**
 * Force refresh cache (useful after taxonomy changes)
 */
export async function forceRefreshCache(): Promise<void> {
  await refreshCache();
  console.log("Taxonomy cache force refreshed");
}

/**
 * Find location ID by name (fuzzy match)
 */
export async function findLocationByName(name: string): Promise<string | null> {
  const cache = await getCache();
  if (!cache.locations) {
    return null;
  }

  const searchName = name.toLowerCase().trim();

  // Exact match first
  if (cache.locations.has(searchName)) {
    return cache.locations.get(searchName)!;
  }

  // Partial match (contains)
  for (const [locationName, id] of cache.locations) {
    if (
      locationName.includes(searchName) ||
      searchName.includes(locationName)
    ) {
      return id;
    }
  }

  return null;
}

/**
 * Find property type ID by name
 */
export async function findPropertyTypeByName(
  name: string
): Promise<string | null> {
  const cache = await getCache();
  if (!cache.propertyTypes) {
    return null;
  }

  const searchName = name.toLowerCase().trim();

  if (cache.propertyTypes.has(searchName)) {
    return cache.propertyTypes.get(searchName)!;
  }

  return null;
}

/**
 * Find feature IDs by names
 */
export async function findIndoorFeatureIds(names: string[]): Promise<string[]> {
  const cache = await getCache();
  if (!cache.indoorFeatures) {
    return [];
  }

  return names
    .map((name) => name.toLowerCase().trim())
    .map((name) => cache.indoorFeatures?.get(name))
    .filter((id): id is string => id !== undefined);
}

export async function findOutdoorFeatureIds(
  names: string[]
): Promise<string[]> {
  const cache = await getCache();
  if (!cache.outdoorFeatures) {
    return [];
  }

  return names
    .map((name) => name.toLowerCase().trim())
    .map((name) => cache.outdoorFeatures?.get(name))
    .filter((id): id is string => id !== undefined);
}

/**
 * Get all locations for user presentation
 */
export async function getAllLocations(): Promise<
  Array<{ name: string; id: string }>
> {
  const cache = await getCache();
  if (!cache.locations) {
    return [];
  }

  return Array.from(cache.locations.entries()).map(([name, id]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    id,
  }));
}

/**
 * Get all property types
 */
export async function getAllPropertyTypes(): Promise<
  Array<{ name: string; id: string }>
> {
  const cache = await getCache();
  if (!cache.propertyTypes) {
    return [];
  }

  return Array.from(cache.propertyTypes.entries()).map(([name, id]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    id,
  }));
}

/**
 * Get all features
 */
export async function getAllIndoorFeatures(): Promise<
  Array<{ name: string; id: string }>
> {
  const cache = await getCache();
  if (!cache.indoorFeatures) {
    return [];
  }

  return Array.from(cache.indoorFeatures.entries()).map(([name, id]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    id,
  }));
}

export async function getAllOutdoorFeatures(): Promise<
  Array<{ name: string; id: string }>
> {
  const cache = await getCache();
  if (!cache.outdoorFeatures) {
    return [];
  }

  return Array.from(cache.outdoorFeatures.entries()).map(([name, id]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    id,
  }));
}

/**
 * Get all price modifiers
 */
export async function getAllPriceModifiers(): Promise<
  Array<{ name: string; id: string }>
> {
  const cache = await getCache();
  if (!cache.priceModifiers) {
    return [];
  }

  return Array.from(cache.priceModifiers.entries()).map(([name, id]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    id,
  }));
}

/**
 * Get all title deeds
 */
export async function getAllTitleDeeds(): Promise<
  Array<{ name: string; id: string }>
> {
  const cache = await getCache();
  if (!cache.titleDeeds) {
    return [];
  }

  return Array.from(cache.titleDeeds.entries()).map(([name, id]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    id,
  }));
}

/**
 * Check if cache has data (even if stale)
 */
export async function hasCacheData(): Promise<boolean> {
  return globalCache.lastUpdated > 0;
}
