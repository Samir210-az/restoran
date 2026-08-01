/**
 * QEYD (bug duzelisi): next-pwa-nin OZ defolt runtimeCaching-i HTML
 * sehife novigasiyalarini da keşleyir - bu, "force-dynamic" olan
 * sehifelerin (mes. restoran directory-si) BROWSER-de köhne
 * melumatla "ilişib" qalmasina sebeb olurdu (server tereфde her şey
 * duzgun idi, servis worker isə köhne HTML-i şəbəkəyə getmeden
 * qaytarirdi). Duzelis: sehife naviqasiyalari HEC vaxt keşlenmir
 * (NetworkOnly) - restoran siyahisi/menyu/qiymetler HEMISE canli
 * olmalidir. Yalniz DEYISMEZ statik fayllar (JS/CSS/şekiller) keşlenir.
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
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  /**
   * QEYD (bug duzelisi - "köhnə cache silinmir" şikayətinin ƏSL
   * KÖKÜ): Vercel/CDN sw.js faylını da statik fayl kimi UZUN MÜDDƏT
   * keşləyə bilirdi - bu, brauzerin YENİ deploy olunmuş service
   * worker-i belə fərq etməməsinə səbəb olurdu (istifadəçi "sil,
   * yenidən yüklə" etsə də köhnə sw.js şəbəkədən deyil, keşdən
   * gəlirdi). Endi sw.js HƏR SƏHİFƏ açılışında YENİDƏN yoxlanılır.
   */
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
