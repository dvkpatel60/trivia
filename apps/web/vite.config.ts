import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // `netlify dev` serves the functions; `vite dev` alone falls back to
      // local pass-and-play, which needs no server at all.
      "/.netlify": "http://localhost:8888",
    },
  },
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
