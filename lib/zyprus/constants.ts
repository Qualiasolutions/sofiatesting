/**
 * Zyprus API Constants
 *
 * This file contains configuration constants for the Zyprus API integration.
 */

/**
 * Default reviewer/instructor user UUID for AI-generated listings.
 *
 * DEV9: Laurent Locchi (f662508c-513a-4d94-bdb8-d538939f9ec4)
 * PRODUCTION: TODO - Update with Lauren Ellingham's UUID when deploying to production
 *
 * All AI-generated listings are assigned to this user for review.
 */
export const DEFAULT_LISTING_REVIEWER_UUID = "f662508c-513a-4d94-bdb8-d538939f9ec4";

/**
 * The instructor is the same as the reviewer for AI-generated listings.
 */
export const DEFAULT_LISTING_INSTRUCTOR_UUID = DEFAULT_LISTING_REVIEWER_UUID;

/**
 * Default location UUID (Acropolis, Strovolos) - fallback when no location specified
 */
export const DEFAULT_LOCATION_UUID = "7dbc931e-90eb-4b89-9ac8-b5e593831cf8";

/**
 * Default property type UUID (Apartment) - fallback when no type specified
 */
export const DEFAULT_PROPERTY_TYPE_UUID = "e3c4bd56-f8c4-4672-b4a2-23d6afe6ca44";
