"use client";

import { useState, useTransition } from "react";
import { RotateCcw, X } from "lucide-react";
import { resetRestaurantDataAction } from "@/app/platform/actions";

/**
 * Destruktiv emeliyyat oldugu ucun (SIFARISLER, REZERVASIYALAR,
 * MUSTERILER, XERCLER hamisi silinir) - tesadufi klikin qarsisini
 * almaq ucun restoranin oz adini yazmaq teleb olunur (GitHub-in
 * "type the repo name to delete" pattern-i).
 */
export function ResetRestaurantButton({ restaurantId, restaurantName }: { restaurantId: string; restaurantName: string }) {
  const [isOpen, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-md border border-border-strong px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:border-danger/50 hover:text-danger"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Sıfırla
      </button>
    );
  }

  return (
    <div className="w-56 rounded-md border border-danger/40 bg-danger/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-danger">Test məlumatlarını sil</p>
        <button type="button" onClick={() => setOpen(false)} aria-label="Bağla">
          <X className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
        </button>
      </div>
      <p className="mb-2 text-[11px] text-text-secondary">
        Bütün sifarişlər, rezervasiyalar, müştərilər, xərclər silinəcək. Menyu, işçilər, masalar qalacaq. Təsdiq üçün{" "}
        <span className="font-mono font-semibold">{restaurantName}</span> yazın:
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={restaurantName}
        className="mb-2 w-full rounded-md border border-border-strong bg-bg px-2 py-1.5 text-xs text-text-primary"
      />
      <button
        type="button"
        disabled={isPending || confirmText.trim().toLowerCase() !== restaurantName.trim().toLowerCase()}
        onClick={() =>
          startTransition(() => resetRestaurantDataAction(restaurantId, confirmText, restaurantName))
        }
        className="w-full rounded-md bg-danger px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
      >
        {isPending ? "Sıfırlanır..." : "Həmişəlik sil"}
      </button>
    </div>
  );
}
