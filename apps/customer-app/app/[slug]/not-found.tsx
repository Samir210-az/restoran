import Link from "next/link";
import { Sticker } from "@restoran/ui";

export default function RestaurantNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Sticker name="coffee-splash" size={112} className="drop-shadow-lg" />
      <h1 className="text-xl font-semibold text-text-primary">Restoran tapılmadı</h1>
      <p className="max-w-sm text-sm text-text-secondary">
        Bu keçid etibarsızdır və ya restoran hazırda aktiv deyil.
      </p>
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90"
      >
        Ana səhifəyə qayıt
      </Link>
    </div>
  );
}
