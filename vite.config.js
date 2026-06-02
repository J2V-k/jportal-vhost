import path from "path";
import fs from "fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
          charts: ['recharts'],
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      devOptions: {
        enabled: true,
      },
      minify: false,
      includeAssets: ['pwa-icons/circle.svg', 'pwa-icons/circle.ico'],
      workbox: {
        maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,whl,json,wasm,data}"],
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /\/artifact\//, /\.json$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/pyodide\/v0\.23\.4\/full\//,
            handler: "CacheFirst",
            options: {
              cacheName: "pyodide-core-cache",
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /\/artifact\/.*\.whl$/,
            handler: "CacheFirst",
            options: {
              cacheName: "python-packages-cache",
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /\/studentsexamview\/printstudent-exammarks\/.*/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "marks-pdf-cache",
              expiration: {
                maxEntries: 25,
                maxAgeSeconds: 60 * 60 * 24 * 3,
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
          {
            urlPattern: /\.(?:wasm|data)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "wasm-cache",
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
            },
          },
        ],
        additionalManifestEntries: [
          { url: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js", revision: null },
          { url: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.asm.js", revision: null },
          { url: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.asm.wasm", revision: null },
          { url: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.asm.data", revision: null },
          { url: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/repodata.json", revision: null },
          { url: "https://cdn.jsdelivr.net/gh/J2V-k/jportal-vhost@main/public/artifact/jiit_marks-0.2.0-py3-none-any.whl", revision: null },
          { url: "https://raw.githubusercontent.com/J2V-k/jportal-vhost/main/public/artifact/PyMuPDF-1.24.12-cp311-abi3-emscripten_3_1_32_wasm32.whl", revision: null },
        ],
      },
      manifest: {
        name: "JP Portal",
        short_name: "JP Portal",
        description: "A web portal for students to view attendance and grades.",
        start_url: "/",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        orientation: "portrait",
        launch_handler: {
          client_mode: "navigate-existing"
        },
        icons: [
          {
            src: "https://cdn.jsdelivr.net/gh/J2V-k/jportal-vhost@main/public/pwa-icons/wheel.svg",
            sizes: "48x48",
          },
          {
            src: "https://cdn.jsdelivr.net/gh/J2V-k/jportal-vhost@main/public/pwa-icons/wheel.svg",
            sizes: "72x72 96x96",
            purpose: "maskable",
          },
          {
            src: "https://cdn.jsdelivr.net/gh/J2V-k/jportal-vhost@main/public/pwa-icons/wheel.svg",
            sizes: "128x128 256x256",
          },
          {
            src: "https://cdn.jsdelivr.net/gh/J2V-k/jportal-vhost@main/public/pwa-icons/wheel.svg",
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
});