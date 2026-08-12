import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Portable, client-only release. `base: "./"` keeps the one-entry demo
 * deployable below any directory on any static host.
 */
export default defineConfig({
  root: "static",
  publicDir: "../public",
  base: "./",
  plugins: [react()],
  build: {
    outDir: "../dist-static",
    emptyOutDir: true,
  },
});
