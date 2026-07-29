"use client";

import { useTransition } from "react";
import { Badge } from "@restoran/ui";
import { toggleItemAvailabilityAction } from "@/app/(dashboard)/menu/actions";

export function AvailabilityToggle({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => toggleItemAvailabilityAction(itemId, !isAvailable))}
      className="disabled:opacity-50"
      aria-label={isAvailable ? "Mövcud deyil et" : "Mövcud et"}
    >
      <Badge variant={isAvailable ? "success" : "neutral"}>
        {isAvailable ? "Mövcuddur" : "Mövcud deyil"}
      </Badge>
    </button>
  );
}
