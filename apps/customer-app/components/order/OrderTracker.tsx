"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ChefHat, Clock } from "lucide-react";
import { Card, Badge } from "@restoran/ui";
import { cn } from "@restoran/utils";
import { createSupabasePublicClient } from "@restoran/supabase-client";
import { ReviewForm } from "./ReviewForm";

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "served" | "completed" | "cancelled";

interface OrderItemJson {
  id: string;
  quantity: number;
  unit_price: number;
  kitchen_status: string;
  name: Record<string, string>;
}

export interface OrderTrackingRow {
  id: string;
  status: OrderStatus;
  order_type: string;
  total: number;
  created_at: string;
  items: OrderItemJson[];
  payment_status: string | null;
}

const STEPS: { status: OrderStatus; label: string; icon: typeof Clock }[] = [
  { status: "pending", label: "Qəbul edildi", icon: Clock },
  { status: "confirmed", label: "Təsdiqləndi", icon: CheckCircle2 },
  { status: "preparing", label: "Hazırlanır", icon: ChefHat },
  { status: "ready", label: "Hazırdır", icon: CheckCircle2 },
  { status: "served", label: "Təqdim edildi", icon: CheckCircle2 },
];

const POLL_INTERVAL_MS = 4000;

/**
 * Sifaris ID-si "capability token" kimi ishlenir (bax: get_order_tracking
 * RPC-si - yalniz TEK setir, siyahilama yoxdur). Realtime (postgres_changes)
 * anon rol ucun texniki olaraq RLS-de "hamiya aciq SELECT" teleb edirdi ki,
 * bu da butun sifarişleri siyahilamaga imkan verirdi - tehlukesizlik ucun
 * bunun evezine qisa intervalli polling istifade olunur (4 saniye).
 */
export function OrderTracker({ orderId, initialOrder }: { orderId: string; initialOrder: OrderTrackingRow }) {
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    const supabase = createSupabasePublicClient();
    const interval = setInterval(async () => {
      const { data } = await supabase.rpc("get_order_tracking", { _order_id: orderId });
      if (data?.[0]) setOrder(data[0] as unknown as OrderTrackingRow);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [orderId]);

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
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-text-primary">
                {item.quantity} × {item.name?.az ?? "Məhsul"}
              </span>
              <span className="text-text-secondary">{(item.unit_price * item.quantity).toFixed(2)} ₼</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold text-text-primary">
          <span>Cəmi</span>
          <span>{Number(order.total).toFixed(2)} ₼</span>
        </div>
        {order.payment_status && (
          <div className="mt-2 flex justify-end">
            <Badge variant={order.payment_status === "completed" ? "success" : "warning"}>
              {order.payment_status === "completed" ? "Ödənilib" : "Ödəniş gözlənilir"}
            </Badge>
          </div>
        )}
      </Card>

      {(order.status === "completed" || order.status === "served") && <ReviewForm orderId={order.id} />}
    </div>
  );
}
