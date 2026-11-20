"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Flame, CheckCircle2 } from "lucide-react";
import { Card, CardTitle, Badge, Button } from "@restoran/ui";
import { createSupabaseBrowserClient } from "@restoran/supabase-client";
import { advanceKitchenItemStatusAction } from "@/app/(dashboard)/kitchen/actions";

interface KitchenItem {
  id: string;
  order_id: string;
  quantity: number;
  kitchen_status: "queued" | "cooking" | "ready";
  special_instructions: string | null;
  is_addition: boolean;
  created_at: string;
  menu_item_name: string;
  table_number: string | null;
}

const COLUMN_META = {
  queued: { label: "Sırada", icon: Clock, badge: "neutral" as const },
  cooking: { label: "Hazırlanır", icon: Flame, badge: "warning" as const },
  ready: { label: "Hazırdır", icon: CheckCircle2, badge: "success" as const },
};

/**
 * Uc sutunlu kanban (Sirada -> Hazirlanir -> Hazirdir). Realtime abunelik
 * `order_items` cedvelinde restaurant_id-e gore filterlenir ki, mətbəx
 * ekrani ani (saniyeler daxilinde) yenilensin - sehife yenilemeye ehtiyac yoxdur.
 */
export function KitchenBoard({
  restaurantId,
  initialItems,
  station,
}: {
  restaurantId: string;
  initialItems: KitchenItem[];
  station: "kitchen" | "bar";
}) {
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`${station}-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as { id: string; kitchen_status: KitchenItem["kitchen_status"] };
            setItems((prev) =>
              prev.map((item) => (item.id === updated.id ? { ...item, kitchen_status: updated.kitchen_status } : item))
            );
          }
          if (payload.eventType === "INSERT") router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, station, router]);

  function handleAdvance(itemId: string, status: string) {
    startTransition(() => {
      advanceKitchenItemStatusAction(itemId, status);
    });
  }

  const columns: Array<keyof typeof COLUMN_META> = station === "bar" ? ["queued", "ready"] : ["queued", "cooking", "ready"];

  return (
    <div className={`grid grid-cols-1 gap-4 ${station === "bar" ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
      {columns.map((status) => {
        const meta = COLUMN_META[status];
        const Icon = meta.icon;
        const columnItems = items.filter((item) => item.kitchen_status === status);

        return (
          <div key={status} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <Icon className="h-4 w-4 text-text-secondary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-text-primary">{meta.label}</h2>
              <Badge variant={meta.badge}>{columnItems.length}</Badge>
            </div>

            {columnItems.length === 0 ? (
              <Card className="border-dashed py-8 text-center">
                <p className="text-xs text-text-muted">Boşdur</p>
              </Card>
            ) : (
              columnItems.map((item) => (
                <Card key={item.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base">
                        {item.quantity} × {item.menu_item_name}
                        {item.is_addition && <Badge variant="warning" className="ml-2 align-middle">Əlavə</Badge>}
                      </CardTitle>
                      {item.table_number && (
                        <p className="mt-0.5 text-xs text-text-muted">Masa {item.table_number}</p>
                      )}
                      {item.special_instructions && (
                        <p className="mt-1 text-xs text-warning">{item.special_instructions}</p>
                      )}
                    </div>
                  </div>

                  {status !== "ready" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full"
                      disabled={isPending}
                      onClick={() => handleAdvance(item.id, status)}
                    >
                      {status === "queued" && station === "kitchen" ? "Hazırlanmağa başla" : "Hazırdır olaraq işarələ"}
                    </Button>
                  )}
                </Card>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
