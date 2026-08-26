import { defineConfig } from "vitest/config";

/** The browser suite: slow, needs a build, run on demand. */
export default defineConfig({
  test: {
    include: ["netlify/tests/e2e.test.mts"],
    environment: "node",
    testTimeout: 120_000,
    hookTimeout: 60_000,
  },
});
