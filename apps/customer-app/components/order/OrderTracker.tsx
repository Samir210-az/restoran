"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ChefHat, Clock } from "lucide-react";
import { Card, Badge } from "@restoran/ui";
import { cn } from "@restoran/utils";
import { createSupabaseBrowserClient } from "@restoran/supabase-client";
import { ReviewForm } from "./ReviewForm";

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "served" | "completed" | "cancelled";

interface OrderRow {
  id: string;
  status: OrderStatus;
  order_type: string;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  restaurant_id: string;
}

interface OrderItemRow {
  id: string;
  quantity: number;
  unit_price: number;
  kitchen_status: string;
  menu_item_id: string;
  menu_items: { name: Record<string, string> } | { name: Record<string, string> }[] | null;
}

const STEPS: { status: OrderStatus; label: string; icon: typeof Clock }[] = [
  { status: "pending", label: "Qəbul edildi", icon: Clock },
  { status: "confirmed", label: "Təsdiqləndi", icon: CheckCircle2 },
  { status: "preparing", label: "Hazırlanır", icon: ChefHat },
  { status: "ready", label: "Hazırdır", icon: CheckCircle2 },
  { status: "served", label: "Təqdim edildi", icon: CheckCircle2 },
];

function itemName(row: OrderItemRow): string {
  const rel = Array.isArray(row.menu_items) ? row.menu_items[0] : row.menu_items;
  return rel?.name?.az ?? "Məhsul";
}

/**
 * Sifaris ID-si "capability token" kimi ishlendiyi ucun (bax: migration),
 * bu komponent giris teleb etmeden Supabase Realtime-a birbasa abune ola bilir -
 * yalniz `order_id`-e uygun deyisiklikleri dinleyir.
 */
export function OrderTracker({
  initialOrder,
  initialItems,
}: {
  initialOrder: OrderRow;
  initialItems: OrderItemRow[];
}) {
  const [order, setOrder] = useState(initialOrder);
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`order-${initialOrder.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${initialOrder.id}` },
        (payload) => setOrder((prev) => ({ ...prev, ...(payload.new as Partial<OrderRow>) }))
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "order_items", filter: `order_id=eq.${initialOrder.id}` },
        (payload) => {
          const updated = payload.new as { id: string; kitchen_status: string };
          setItems((prev) =>
            prev.map((item) => (item.id === updated.id ? { ...item, kitchen_status: updated.kitchen_status } : item))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialOrder.id]);

  const isCancelled = order.status === "cancelled";
  const currentStepIndex = STEPS.findIndex((s) => s.status === order.status);

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="mb-6 text-center">
        <p className="text-sm text-text-secondary">Sifariş nömrəsi</p>
        <p className="font-mono text-sm text-text-muted">{order.id.slice(0, 8)}</p>
      </div>

      {isCancelled ? (
        <Card className="mb-6 text-center">
          <Badge variant="danger">Ləğv edilib</Badge>
          <p className="mt-2 text-sm text-text-secondary">Bu sifariş ləğv edilib</p>
        </Card>
      ) : (
        <div className="mb-6 flex flex-col gap-1">
          {STEPS.map((step, index) => {
            const isDone = index <= currentStepIndex;
            const Icon = step.icon;
            return (
              <div key={step.status} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                    isDone ? "border-accent bg-accent-soft text-accent" : "border-border text-text-muted"
                  )}
                >
                  {isDone ? <Icon className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                </div>
                <span className={cn("text-sm", isDone ? "font-medium text-text-primary" : "text-text-muted")}>
                  {step.label}
                </span>
                {index < STEPS.length - 1 && (
                  <div className={cn("ml-4 h-6 w-px", isDone ? "bg-accent" : "bg-border")} aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      )}

      <Card>
        <div className="flex flex-col divide-y divide-border">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-text-primary">
                {item.quantity} × {itemName(item)}
              </span>
              <span className="text-text-secondary">{(item.unit_price * item.quantity).toFixed(2)} ₼</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold text-text-primary">
          <span>Cəmi</span>
          <span>{Number(order.total).toFixed(2)} ₼</span>
        </div>
      </Card>

      {(order.status === "completed" || order.status === "served") && <ReviewForm orderId={order.id} />}
    </div>
  );
}
