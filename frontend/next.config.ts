import type { NextConfig } from "next";

// The UI is driven by per-learner live data fetched on the client (SWR), so
// cacheComponents / partial prerendering are intentionally left off.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
