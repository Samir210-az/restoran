"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@restoran/ui";
import { toggleItemAvailabilityAction } from "@/app/(dashboard)/menu/actions";

export function AvailabilityToggle({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleItemAvailabilityAction(itemId, !isAvailable);
          router.refresh();
        })
      }
      className="disabled:opacity-50"
      aria-label={isAvailable ? "Mövcud deyil et" : "Mövcud et"}
    >
      <Badge variant={isAvailable ? "success" : "neutral"}>
        {isAvailable ? "Mövcuddur" : "Mövcud deyil"}
      </Badge>
    </button>
  );
}
