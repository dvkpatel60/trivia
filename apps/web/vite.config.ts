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
  },
});
