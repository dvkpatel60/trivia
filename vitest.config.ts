import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The end-to-end suite is excluded here and run by `npm run test:e2e`,
    // which builds first — otherwise it would quietly test a stale bundle.
    include: ["packages/*/src/**/*.test.ts", "netlify/tests/**/*.test.mts"],
    exclude: ["**/node_modules/**", "**/dist/**", "netlify/tests/e2e.test.mts"],
    environment: "node",
  },
});
