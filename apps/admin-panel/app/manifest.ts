import type { MetadataRoute } from "next";

/**
 * Next.js-in xüsusi manifest faylı - avtomatik olaraq /manifest.webmanifest
 * kimi serve olunur və <head>-e link tag-i ozunden elave edir (elave
 * kod lazim deyil). Bu, admin panelin telefonda "Ana ekrana elave et"
 * / tetbiq kimi qurulmasini temin edir.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Restoran — İdarəetmə Paneli",
    short_name: "Restoran Admin",
    description: "AI dəstəkli restoran idarəetmə platforması",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#B48428",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
