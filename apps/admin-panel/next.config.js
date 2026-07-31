/**
 * QEYD (bug duzelisi - bax customer-app/next.config.js-deki eyni izah):
 * sehife naviqasiyalari HEC vaxt keşlenmir - admin panelde sifariş/
 * rezervasiya/hesabat kimi HEMISE canli olmali melumatlar var, keşlenmiş
 * köhne HTML ciddi qarisikliga sebeb ola biler (mes. artiq movcud
 * olmayan restoranin gorunmesi).
 */
const runtimeCaching = [
  {
    urlPattern: ({ request }) => request.mode === "navigate",
    handler: "NetworkOnly",
  },
  {
    urlPattern: /\/api\/.*$/i,
    handler: "NetworkOnly",
  },
  {
    urlPattern: /\/_next\/static\/.+\.(?:js|css)$/i,
    handler: "CacheFirst",
    options: {
      cacheName: "static-resources",
      expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
    },
  },
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
    handler: "CacheFirst",
    options: {
      cacheName: "images",
      expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
    },
  },
];

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@restoran/ui", "@restoran/utils", "@restoran/types", "@restoran/supabase-client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

module.exports = withPWA(nextConfig);
