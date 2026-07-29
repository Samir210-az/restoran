"use client";

import { useEffect } from "react";
import { Button } from "@restoran/ui";
import { logger } from "@restoran/utils";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Müştəri tətbiqində render xətası", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold text-text-primary">Nəsə səhv getdi</h1>
      <p className="max-w-sm text-sm text-text-secondary">Zəhmət olmasa yenidən cəhd edin.</p>
      <Button onClick={reset}>Yenidən cəhd et</Button>
    </div>
  );
}
