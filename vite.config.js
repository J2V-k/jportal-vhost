import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      devOptions: {
        enabled: true,
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 30 * 1024 ** 2, // 30MB
        globPatterns: ["**/*.{js,css,html,ico,png,svg,whl}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/pyodide\/v0\.23\.4\/full\/pyodide\.js$/,
            handler: "CacheFirst",
            options: {
              cacheName: "pyodide-cache",
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 1000, // 1000 days
              },
            },
          },
        ],
        additionalManifestEntries: [
          { url: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js", revision: null },
          { url: "/artifact/jiit_marks-0.2.0-py3-none-any.whl", revision: null },
          { url: "/artifact/PyMuPDF-1.24.12-cp311-abi3-emscripten_3_1_32_wasm32.whl", revision: null },
        ],
      },
      manifest: {
        name: "JP_Portal",
        short_name: "JP_Portal",
        description: "A web portal for students to view attendance and grades.",
        start_url: "/",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        orientation: "portrait",
        icons: [
          {
            src: "pwa-icons/wheel.svg",
            sizes: "48x48",
          },
          {
            src: "pwa-icons/wheel.svg",
            sizes: "72x72 96x96",
            purpose: "maskable",
          },
          {
            src: "pwa-icons/wheel.svg",
            sizes: "128x128 256x256",
          },
          {
            src: "pwa-icons/wheel.svg",
            sizes: "512x512",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://yourfitnesspal-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      }
    }
  },
});