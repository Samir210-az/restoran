"use client";

import { useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";
import { deleteRestaurantAction } from "@/app/platform/actions";

/**
 * "Sıfırla"-dan (ResetRestaurantButton) FERQLI olaraq - bu, restoranin
 * OZUNU (menyu, isciler, masalar, brendinq DAXIL) HƏMİŞƏLİK silir.
 * Qayidilmaz oldugu ucun eyni "adi yaz" tesdiq pattern-i, amma daha
 * qati/qirmizi renglendirme ve aciq "QAYIDILMAZ" xeberdarligi ile.
 */
export function DeleteRestaurantButton({ restaurantId, restaurantName }: { restaurantId: string; restaurantName: string }) {
  const [isOpen, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-danger/40 px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Restoranı həmişəlik sil
      </button>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-md border border-danger/50 bg-danger/5 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-danger">Restoran həmişəlik silinsin?</p>
        <button type="button" onClick={() => setOpen(false)} aria-label="Bağla">
          <X className="h-4 w-4 text-text-muted" aria-hidden="true" />
        </button>
      </div>
      <p className="mb-3 text-xs text-text-secondary">
        <span className="font-semibold text-danger">QAYIDILMAZDIR.</span> Menyu, işçilər, masalar, brendinq, sifarişlər — HAMISI silinəcək.
        Sahibin giriş hesabı (auth) toxunulmaz qalır. Təsdiq üçün <span className="font-mono font-semibold">{restaurantName}</span> yazın:
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={restaurantName}
        className="mb-3 w-full rounded-md border border-border-strong bg-bg px-2 py-1.5 text-sm text-text-primary"
      />
      <button
        type="button"
        disabled={isPending || confirmText.trim().toLowerCase() !== restaurantName.trim().toLowerCase()}
        onClick={() => startTransition(() => deleteRestaurantAction(restaurantId, confirmText, restaurantName))}
        className="w-full rounded-md bg-danger px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        {isPending ? "Silinir..." : "Bəli, həmişəlik sil"}
      </button>
    </div>
  );
}
