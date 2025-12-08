// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://78c4b01fd98abb3c2cff25b0439cdf7a@o4510184257814528.ingest.de.sentry.io/4510184259453008",

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance monitoring sample rate
  tracesSampleRate: 0.1,

  // Setting this option to true will print useful information to the console while setting up Sentry.
  debug: false,
});
