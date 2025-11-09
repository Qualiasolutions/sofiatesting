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

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let cache: TaxonomyCache = {
  lastUpdated: 0,
};

/**
 * Check if cache is stale (older than TTL)
 */
function isCacheStale(): boolean {
  return Date.now() - cache.lastUpdated > CACHE_TTL_MS;
}

/**
 * Refresh all taxonomy data from Zyprus API
 */
async function refreshCache(): Promise<void> {
  try {
    const locations = await getZyprusLocations();
    const propertyTypes = await getZyprusTaxonomyTerms("property_type");
    const indoorFeatures = await getZyprusTaxonomyTerms("indoor_property_features");
    const outdoorFeatures = await getZyprusTaxonomyTerms("outdoor_property_features");
    const priceModifiers = await getZyprusTaxonomyTerms("price_modifier");
    const titleDeeds = await getZyprusTaxonomyTerms("title_deed");

    cache = {
      locations: new Map(
        locations.map((loc: any) => [
          loc.attributes.title.toLowerCase(),
          loc.id
        ])
      ),
      propertyTypes: new Map(
        propertyTypes.map((type: any) => [
          type.attributes.name.toLowerCase(),
          type.id
        ])
      ),
      indoorFeatures: new Map(
        indoorFeatures.map((feature: any) => [
          feature.attributes.name.toLowerCase(),
          feature.id
        ])
      ),
      outdoorFeatures: new Map(
        outdoorFeatures.map((feature: any) => [
          feature.attributes.name.toLowerCase(),
          feature.id
        ])
      ),
      priceModifiers: new Map(
        priceModifiers.map((modifier: any) => [
          modifier.attributes.name.toLowerCase(),
          modifier.id
        ])
      ),
      titleDeeds: new Map(
        titleDeeds.map((deed: any) => [
          deed.attributes.name.toLowerCase(),
          deed.id
        ])
      ),
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error("Failed to refresh taxonomy cache:", error);
    // Keep old cache if refresh fails
  }
}

/**
 * Get cached taxonomy data, refresh if stale
 */
export async function getCache(): Promise<TaxonomyCache> {
  if (isCacheStale()) {
    await refreshCache();
  }
  return cache;
}

/**
 * Force refresh cache (useful after taxonomy changes)
 */
export async function forceRefreshCache(): Promise<void> {
  await refreshCache();
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
    if (locationName.includes(searchName) || searchName.includes(locationName)) {
      return id;
    }
  }

  return null;
}

/**
 * Find property type ID by name
 */
export async function findPropertyTypeByName(name: string): Promise<string | null> {
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
    .map(name => name.toLowerCase().trim())
    .map(name => cache.indoorFeatures!.get(name))
    .filter((id): id is string => id !== undefined);
}

export async function findOutdoorFeatureIds(names: string[]): Promise<string[]> {
  const cache = await getCache();
  if (!cache.outdoorFeatures) return [];

  return names
    .map(name => name.toLowerCase().trim())
    .map(name => cache.outdoorFeatures!.get(name))
    .filter((id): id is string => id !== undefined);
}

/**
 * Get all locations for user presentation
 */
export async function getAllLocations(): Promise<Array<{name: string, id: string}>> {
  const cache = await getCache();
  if (!cache.locations) return [];

  return Array.from(cache.locations.entries()).map(([name, id]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    id
  }));
}

/**
 * Get all property types
 */
export async function getAllPropertyTypes(): Promise<Array<{name: string, id: string}>> {
  const cache = await getCache();
  if (!cache.propertyTypes) return [];

  return Array.from(cache.propertyTypes.entries()).map(([name, id]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    id
  }));
}

/**
 * Get all features
 */
export async function getAllIndoorFeatures(): Promise<Array<{name: string, id: string}>> {
  const cache = await getCache();
  if (!cache.indoorFeatures) return [];

  return Array.from(cache.indoorFeatures.entries()).map(([name, id]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    id
  }));
}

export async function getAllOutdoorFeatures(): Promise<Array<{name: string, id: string}>> {
  const cache = await getCache();
  if (!cache.outdoorFeatures) return [];

  return Array.from(cache.outdoorFeatures.entries()).map(([name, id]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    id
  }));
}

/**
 * Get all price modifiers
 */
export async function getAllPriceModifiers(): Promise<Array<{name: string, id: string}>> {
  const cache = await getCache();
  if (!cache.priceModifiers) return [];

  return Array.from(cache.priceModifiers.entries()).map(([name, id]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    id
  }));
}

/**
 * Get all title deeds
 */
export async function getAllTitleDeeds(): Promise<Array<{name: string, id: string}>> {
  const cache = await getCache();
  if (!cache.titleDeeds) return [];

  return Array.from(cache.titleDeeds.entries()).map(([name, id]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    id
  }));
}

/**
 * Check if cache has data (even if stale)
 */
export function hasCacheData(): boolean {
  return cache.lastUpdated > 0;
}
