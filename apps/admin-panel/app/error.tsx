"use client";

import { useEffect } from "react";
import { Button } from "@restoran/ui";
import { logger } from "@restoran/utils";

/**
 * Next.js-in App Router-de tanidigi qlobal xeta serhedi (error boundary).
 * Hansi render/route xetasi olursa olsun, istifadeciye bos ag sehife
 * evezine anlasilan bir ekran gosterilir.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Client-side render xetasi", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-danger">Xəta baş verdi</p>
      <h1 className="text-2xl font-semibold text-text-primary">Nəsə səhv getdi</h1>
      <p className="max-w-sm text-sm text-text-secondary">
        Səhifəni yeniləməyə çalışın. Problem davam edərsə, dəstək komandası ilə əlaqə saxlayın.
      </p>
      <Button onClick={reset}>Yenidən cəhd et</Button>
    </div>
  );
}
