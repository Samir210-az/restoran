"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@restoran/ui";
import { createSupabaseBrowserClient } from "@restoran/supabase-client";
import { localize } from "@restoran/utils";
import type { Database } from "@restoran/supabase-client";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

export function MenuItemRow({ item }: { item: MenuItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAvailable, setIsAvailable] = useState(item.is_available);

  function toggleAvailability() {
    const next = !isAvailable;
    setIsAvailable(next);

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: next })
        .eq("id", item.id);

      if (error) {
        setIsAvailable(!next);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{localize(item.name)}</p>
        {localize(item.description) && (
          <p className="mt-0.5 truncate text-xs text-text-secondary">{localize(item.description)}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm font-semibold text-text-primary">{item.price.toFixed(2)} ₼</span>
        <button
          onClick={toggleAvailability}
          disabled={isPending}
          className="disabled:opacity-50"
          aria-label={isAvailable ? "Menyudan gizlət" : "Menyuda göstər"}
        >
          <Badge variant={isAvailable ? "success" : "neutral"}>
            {isAvailable ? "Aktiv" : "Gizli"}
          </Badge>
        </button>
      </div>
    </div>
  );
}
