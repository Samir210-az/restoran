"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@restoran/ui";
import { cn } from "@restoran/utils";
import { createWaiterOrderAction } from "@/app/(dashboard)/order-new/actions";

interface CategoryRow {
  id: string;
  name: Record<string, string>;
}

interface ItemRow {
  id: string;
  category_id: string;
  name: Record<string, string>;
  price: number;
}

interface CartEntry {
  item: ItemRow;
  quantity: number;
}

/**
 * Ofisiantin masa ucun sur'etli sifaris goturme ekrani. Musteri
 * tetbiqindeki MenuView-e oxsayir, amma daha sade (odenis usulu
 * secimi yoxdur - hemise "cash" kimi qeyd olunur, real odenis
 * kassada ayrica idare olunur) ve staff auth ile ishleyir.
 */
export function WaiterOrderForm({
  categories,
  items,
  tableId,
  tableLabel,
}: {
  categories: CategoryRow[];
  items: ItemRow[];
  tableId: string | null;
  tableLabel: string;
}) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(categories[0]?.id ?? null);
  const [cart, setCart] = useState<Record<string, CartEntry>>({});
  const [isPending, startTransition] = useTransition();

  const visibleItems = activeCategoryId ? items.filter((i) => i.category_id === activeCategoryId) : items;
  const cartEntries = Object.values(cart);
  const cartTotal = useMemo(
    () => cartEntries.reduce((sum, e) => sum + e.item.price * e.quantity, 0),
    [cartEntries]
  );

  function changeQty(item: ItemRow, delta: number) {
    setCart((prev) => {
      const existing = prev[item.id];
      const nextQty = (existing?.quantity ?? 0) + delta;
      if (nextQty <= 0) {
        const { [item.id]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [item.id]: { item, quantity: nextQty } };
    });
  }

  function handleSubmit() {
    startTransition(() => {
      createWaiterOrderAction({
        tableId,
        items: cartEntries.map((e) => ({ menuItemId: e.item.id, quantity: e.quantity })),
      });
    });
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <p className="text-sm text-text-secondary">{tableLabel} üçün sifariş</p>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategoryId(c.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium",
              activeCategoryId === c.id ? "border-accent bg-accent-soft text-accent" : "border-border text-text-secondary"
            )}
          >
            {c.name.az}
          </button>
        ))}
      </div>

      <div className="flex flex-col divide-y divide-border">
        {visibleItems.map((item) => {
          const qty = cart[item.id]?.quantity ?? 0;
          return (
            <div key={item.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-text-primary">{item.name.az}</p>
                <p className="text-sm text-text-secondary">{item.price.toFixed(2)} ₼</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeQty(item, -1)}
                  disabled={qty === 0}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border-strong disabled:opacity-30"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-4 text-center text-sm">{qty}</span>
                <button
                  onClick={() => changeQty(item, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {cartEntries.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg-elevated p-4 shadow-elevated md:left-64">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <div>
              <p className="text-xs text-text-secondary">{cartEntries.length} məhsul</p>
              <p className="font-semibold text-text-primary">{cartTotal.toFixed(2)} ₼</p>
            </div>
            <Button onClick={handleSubmit} isLoading={isPending} disabled={isPending}>
              Sifarişi göndər
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
