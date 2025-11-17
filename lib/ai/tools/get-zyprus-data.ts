import { tool } from "ai";
import { z } from "zod";
import {
  forceRefreshCache,
  getAllIndoorFeatures,
  getAllLocations,
  getAllOutdoorFeatures,
  getAllPriceModifiers,
  getAllPropertyTypes,
  getAllTitleDeeds,
  hasCacheData,
} from "@/lib/zyprus/taxonomy-cache";

export const getZyprusDataTool = tool({
  description:
    "Get available taxonomy data from zyprus.com for property listings. Use this when users ask about available locations, property types, features, or other options. When taxonomy fields are empty or users need to see options, call this tool to fetch and present choices. This includes Cyprus locations, property types (villa, apartment, etc.), indoor features (pool, AC, etc.), outdoor features (garden, balcony, etc.), price modifiers, and title deed types.",
  inputSchema: z.object({
    resourceType: z
      .enum([
        "locations",
        "property_types",
        "indoor_features",
        "outdoor_features",
        "price_modifiers",
        "title_deeds",
        "all",
      ])
      .describe(
        "Type of taxonomy data to fetch from zyprus.com. Use 'all' to fetch everything at once, or specific types when user asks about particular options."
      ),
    refreshCache: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Force refresh the taxonomy cache. Only set to true if user suspects data on zyprus.com has changed or cache seems stale."
      ),
  }),
  execute: async ({ resourceType, refreshCache: shouldRefresh }) => {
    try {
      // Force refresh if requested
      if (shouldRefresh) {
        await forceRefreshCache();
      }

      // Initialize cache if empty
      if (!(await hasCacheData())) {
        await forceRefreshCache();
      }

      // Fetch requested data
      switch (resourceType) {
        case "locations": {
          const locations = await getAllLocations();
          return {
            success: true,
            data: {
              locations: locations.map((loc) => ({
                name: loc.name,
                id: loc.id,
                description: `Location: ${loc.name}`,
              })),
            },
            message: `Found ${locations.length} locations on zyprus.com`,
          };
        }

        case "property_types": {
          const propertyTypes = await getAllPropertyTypes();
          return {
            success: true,
            data: {
              propertyTypes: propertyTypes.map((type) => ({
                name: type.name,
                id: type.id,
                description: `Property type: ${type.name}`,
              })),
            },
            message: `Found ${propertyTypes.length} property types on zyprus.com`,
          };
        }

        case "indoor_features": {
          const indoorFeatures = await getAllIndoorFeatures();
          return {
            success: true,
            data: {
              indoorFeatures: indoorFeatures.map((feature) => ({
                name: feature.name,
                id: feature.id,
                description: `Indoor feature: ${feature.name}`,
              })),
            },
            message: `Found ${indoorFeatures.length} indoor features on zyprus.com`,
          };
        }

        case "outdoor_features": {
          const outdoorFeatures = await getAllOutdoorFeatures();
          return {
            success: true,
            data: {
              outdoorFeatures: outdoorFeatures.map((feature) => ({
                name: feature.name,
                id: feature.id,
                description: `Outdoor feature: ${feature.name}`,
              })),
            },
            message: `Found ${outdoorFeatures.length} outdoor features on zyprus.com`,
          };
        }

        case "price_modifiers": {
          const priceModifiers = await getAllPriceModifiers();
          return {
            success: true,
            data: {
              priceModifiers: priceModifiers.map((modifier) => ({
                name: modifier.name,
                id: modifier.id,
                description: `Price modifier: ${modifier.name}`,
              })),
            },
            message: `Found ${priceModifiers.length} price modifiers on zyprus.com`,
          };
        }

        case "title_deeds": {
          const titleDeeds = await getAllTitleDeeds();
          return {
            success: true,
            data: {
              titleDeeds: titleDeeds.map((deed) => ({
                name: deed.name,
                id: deed.id,
                description: `Title deed: ${deed.name}`,
              })),
            },
            message: `Found ${titleDeeds.length} title deed types on zyprus.com`,
          };
        }

        case "all": {
          const [
            allLocations,
            allPropertyTypes,
            allIndoorFeatures,
            allOutdoorFeatures,
            allPriceModifiers,
            allTitleDeeds,
          ] = await Promise.all([
            getAllLocations(),
            getAllPropertyTypes(),
            getAllIndoorFeatures(),
            getAllOutdoorFeatures(),
            getAllPriceModifiers(),
            getAllTitleDeeds(),
          ]);

          return {
            success: true,
            data: {
              locations: allLocations.map((loc) => ({
                name: loc.name,
                id: loc.id,
              })),
              propertyTypes: allPropertyTypes.map((type) => ({
                name: type.name,
                id: type.id,
              })),
              indoorFeatures: allIndoorFeatures.map((feature) => ({
                name: feature.name,
                id: feature.id,
              })),
              outdoorFeatures: allOutdoorFeatures.map((feature) => ({
                name: feature.name,
                id: feature.id,
              })),
              priceModifiers: allPriceModifiers.map((modifier) => ({
                name: modifier.name,
                id: modifier.id,
              })),
              titleDeeds: allTitleDeeds.map((deed) => ({
                name: deed.name,
                id: deed.id,
              })),
            },
            message: `Fetched complete taxonomy from zyprus.com: ${allLocations.length} locations, ${allPropertyTypes.length} property types, ${allIndoorFeatures.length} indoor features, ${allOutdoorFeatures.length} outdoor features, ${allPriceModifiers.length} price modifiers, ${allTitleDeeds.length} title deeds`,
          };
        }

        default:
          return {
            success: false,
            error: `Unknown resource type: ${resourceType}`,
          };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching Zyprus taxonomy:", errorMessage);
      return {
        success: false,
        error: `Failed to fetch data from zyprus.com: ${errorMessage}`,
      };
    }
  },
});
