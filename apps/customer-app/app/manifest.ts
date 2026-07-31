import type { MetadataRoute } from "next";

/**
 * Cox-tenantli oldugu ucun (her restoran ozunun [slug] sehifesinde)
 * manifest TEK ve umumidir - restoran-spesifik loqo/tema burada
 * EKS OLUNMUR (Next.js manifest.ts statik route-dur, hansi restoranin
 * sehifesinden "install" edildiyini bilmir). Musteri hansi restorandan
 * qursa qura, "Restoran" umumi brendi ile Ana ekrana elave olunur.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Restoran — Onlayn Menyu və Sifariş",
    short_name: "Restoran",
    description: "QR menyu, onlayn sifariş və rezervasiya",
    start_url: "/",
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
