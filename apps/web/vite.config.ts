import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    /*
     * Tunnel hosts, for testing cross-device play off a laptop.
     *
     * Vite refuses a request whose Host header it does not recognise, which
     * is a DNS-rebinding guard and the right default — but `netlify dev`
     * forwards the tunnel's Host straight through, so a tunnelled dev server
     * answers every request with "Blocked request. This host is not
     * allowed." A leading dot matches subdomains, which is what these
     * services hand out. Named rather than `true`, so the guard still holds
     * for anything else.
     */
    allowedHosts: [".loca.lt", ".trycloudflare.com", ".ngrok-free.app", ".ngrok.io"],
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
