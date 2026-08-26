import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { gameApi } from "./vite-plugin-game-api.js";

export default defineConfig({
  // `gameApi` mounts the real game function on the dev server, so `npm run
  // dev` is a complete game — hosting, joining and both online pacings —
  // without needing the Netlify CLI.
  plugins: [react(), gameApi()],
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        /*
         * Three chunks that change at different rates: React, the animation
         * engine, and everything we write. The first two are effectively
         * permanent, so a content or UI change only invalidates the third.
         */
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (/node_modules[\\/](motion|framer-motion)[\\/]/.test(id)) return "motion";
          if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "react";
          return undefined;
        },
      },
    },
  },
});
