import { kv } from "@vercel/kv";
import { getZyprusLocations, getZyprusTaxonomyTerms } from "./client";

export interface TaxonomyCache {
  locations?: Map<string, string>; // name → id
  propertyTypes?: Map<string, string>;
  indoorFeatures?: Map<string, string>;
  outdoorFeatures?: Map<string, string>;
  priceModifiers?: Map<string, string>;
  titleDeeds?: Map<string, string>;
  lastUpdated: number;
}

// Serializable version for Redis storage (Maps converted to objects)
interface SerializableTaxonomyCache {
  locations?: Record<string, string>;
  propertyTypes?: Record<string, string>;
  indoorFeatures?: Record<string, string>;
  outdoorFeatures?: Record<string, string>;
  priceModifiers?: Record<string, string>;
  titleDeeds?: Record<string, string>;
  lastUpdated: number;
}

const CACHE_KEY = "zyprus:taxonomy:v1";
const CACHE_TTL_SECONDS = 3600; // 1 hour in seconds

// In-memory fallback cache (used if Redis fails)
let fallbackCache: TaxonomyCache = {
  lastUpdated: 0,
};

/**
 * Convert Maps to plain objects for Redis storage
 */
function serializeCache(cache: TaxonomyCache): SerializableTaxonomyCache {
  return {
    locations: cache.locations
      ? Object.fromEntries(cache.locations)
      : undefined,
    propertyTypes: cache.propertyTypes
      ? Object.fromEntries(cache.propertyTypes)
      : undefined,
    indoorFeatures: cache.indoorFeatures
      ? Object.fromEntries(cache.indoorFeatures)
      : undefined,
    outdoorFeatures: cache.outdoorFeatures
      ? Object.fromEntries(cache.outdoorFeatures)
      : undefined,
    priceModifiers: cache.priceModifiers
      ? Object.fromEntries(cache.priceModifiers)
      : undefined,
    titleDeeds: cache.titleDeeds
      ? Object.fromEntries(cache.titleDeeds)
      : undefined,
    lastUpdated: cache.lastUpdated,
  };
}

/**
 * Convert plain objects back to Maps after Redis retrieval
 */
function deserializeCache(
  serialized: SerializableTaxonomyCache
): TaxonomyCache {
  return {
    locations: serialized.locations
      ? new Map(Object.entries(serialized.locations))
      : undefined,
    propertyTypes: serialized.propertyTypes
      ? new Map(Object.entries(serialized.propertyTypes))
      : undefined,
    indoorFeatures: serialized.indoorFeatures
      ? new Map(Object.entries(serialized.indoorFeatures))
      : undefined,
    outdoorFeatures: serialized.outdoorFeatures
      ? new Map(Object.entries(serialized.outdoorFeatures))
      : undefined,
    priceModifiers: serialized.priceModifiers
      ? new Map(Object.entries(serialized.priceModifiers))
      : undefined,
    titleDeeds: serialized.titleDeeds
      ? new Map(Object.entries(serialized.titleDeeds))
      : undefined,
    lastUpdated: serialized.lastUpdated,
  };
}

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
    process.env.NODE_ENV === "production" && typeof window === "undefined" && !process.env.ZYPRUS_CLIENT_ID
  );
}

/**
 * Refresh all taxonomy data from Zyprus API and store in Redis
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

    // Store in Redis with TTL
    try {
      const serialized = serializeCache(newCache);
      await kv.set(CACHE_KEY, serialized, { ex: CACHE_TTL_SECONDS });
    } catch (redisError) {
      console.error("Failed to store cache in Redis, using fallback:", redisError);
      fallbackCache = newCache;
    }

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

    // At runtime, try to return existing cache from Redis or fallback
    try {
      const serialized = await kv.get<SerializableTaxonomyCache>(CACHE_KEY);
      if (serialized) {
        return deserializeCache(serialized);
      }
    } catch (redisError) {
      console.error("Failed to get existing cache from Redis:", redisError);
    }

    // Return fallback cache if available
    if (fallbackCache.lastUpdated > 0) {
      return fallbackCache;
    }

    // Last resort: empty cache
    return {
      lastUpdated: 0,
    };
  }
}

/**
 * Get cached taxonomy data from Redis, refresh if stale
 */
export async function getCache(): Promise<TaxonomyCache> {
  // During build time, return empty cache immediately
  if (isBuildTime()) {
    console.log("Build time - returning empty taxonomy cache");
    return {
      lastUpdated: 0,
    };
  }

  try {
    // Try to get from Redis first
    const serialized = await kv.get<SerializableTaxonomyCache>(CACHE_KEY);

    if (serialized) {
      const cache = deserializeCache(serialized);

      // Check if stale
      if (isCacheStale(cache)) {
        // Refresh in background, return stale data immediately
        refreshCache().catch((err) =>
          console.error("Background cache refresh failed:", err)
        );
      }

      return cache;
    }

    // Cache miss - fetch fresh data
    return await refreshCache();
  } catch (error) {
    console.error("Failed to get cache from Redis, using fallback:", error);

    // Use in-memory fallback
    if (isCacheStale(fallbackCache)) {
      fallbackCache = await refreshCache();
    }

    return fallbackCache;
  }
}

/**
 * Force refresh cache (useful after taxonomy changes)
 */
export async function forceRefreshCache(): Promise<void> {
  await refreshCache();
  console.log("Taxonomy cache force refreshed and stored in Redis");
}

/**
 * Find location ID by name (fuzzy match)
 */
export async function findLocationByName(name: string): Promise<string | null> {
  const cache = await getCache();
  if (!cache.locations) return null;

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
  if (!cache.propertyTypes) return null;

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
  if (!cache.indoorFeatures) return [];

  return names
    .map((name) => name.toLowerCase().trim())
    .map((name) => cache.indoorFeatures!.get(name))
    .filter((id): id is string => id !== undefined);
}

export async function findOutdoorFeatureIds(
  names: string[]
): Promise<string[]> {
  const cache = await getCache();
  if (!cache.outdoorFeatures) return [];

  return names
    .map((name) => name.toLowerCase().trim())
    .map((name) => cache.outdoorFeatures!.get(name))
    .filter((id): id is string => id !== undefined);
}

/**
 * Get all locations for user presentation
 */
export async function getAllLocations(): Promise<
  Array<{ name: string; id: string }>
> {
  const cache = await getCache();
  if (!cache.locations) return [];

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
  if (!cache.propertyTypes) return [];

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
  if (!cache.indoorFeatures) return [];

  return Array.from(cache.indoorFeatures.entries()).map(([name, id]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    id,
  }));
}

export async function getAllOutdoorFeatures(): Promise<
  Array<{ name: string; id: string }>
> {
  const cache = await getCache();
  if (!cache.outdoorFeatures) return [];

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
  if (!cache.priceModifiers) return [];

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
  if (!cache.titleDeeds) return [];

  return Array.from(cache.titleDeeds.entries()).map(([name, id]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    id,
  }));
}

/**
 * Check if cache has data (even if stale)
 */
export async function hasCacheData(): Promise<boolean> {
  try {
    const serialized = await kv.get<SerializableTaxonomyCache>(CACHE_KEY);
    if (serialized && serialized.lastUpdated > 0) {
      return true;
    }
  } catch (error) {
    console.error("Error checking cache data:", error);
  }

  // Check fallback
  return fallbackCache.lastUpdated > 0;
}
