"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, Badge, Button } from "@restoran/ui";
import { createSupabaseBrowserClient } from "@restoran/supabase-client";
import { advanceOrderStatusAction, cancelOrderAction, markPaymentReceivedAction } from "@/app/(dashboard)/orders/actions";

interface OrderRow {
  id: string;
  status: string;
  order_type: string;
  total: number;
  created_at: string;
  table_number: string | null;
  payment_method: string | null;
  payment_status: string | null;
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Nağd",
  card: "Kart",
  online: "Onlayn",
};

const STATUS_BADGE: Record<string, "neutral" | "warning" | "success" | "danger" | "info" | "accent"> = {
  pending: "neutral",
  confirmed: "info",
  preparing: "warning",
  ready: "accent",
  served: "success",
  completed: "success",
  cancelled: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Gözləyir",
  confirmed: "Təsdiqləndi",
  preparing: "Hazırlanır",
  ready: "Hazırdır",
  served: "Təqdim edildi",
  completed: "Tamamlandı",
  cancelled: "Ləğv edilib",
};

const ACTIVE_STATUSES = new Set(["pending", "confirmed", "preparing", "ready", "served"]);

export function OrdersRealtimeList({ restaurantId, initialOrders }: { restaurantId: string; initialOrders: OrderRow[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          const updated = payload.new as { id: string; status: string };
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  if (orders.length === 0) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-text-secondary">Hələ sifariş yoxdur</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <Card key={order.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-text-muted">#{order.id.slice(0, 8)}</span>
              <Badge variant={STATUS_BADGE[order.status] ?? "neutral"}>{STATUS_LABEL[order.status] ?? order.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              {order.table_number ? `Masa ${order.table_number}` : order.order_type === "takeaway" ? "Özün apar" : "Çatdırılma"}
              {" · "}
              {Number(order.total).toFixed(2)} ₼
              {order.payment_method && (
                <>
                  {" · "}
                  {PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method}
                  {order.payment_status === "completed" ? (
                    <Badge variant="success" className="ml-1">Ödənilib</Badge>
                  ) : (
                    <Badge variant="warning" className="ml-1">Gözləyir</Badge>
                  )}
                </>
              )}
            </p>
          </div>

          {ACTIVE_STATUSES.has(order.status) && (
            <div className="flex gap-2">
              {order.status !== "served" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => startTransition(() => advanceOrderStatusAction(order.id, order.status))}
                >
                  Növbəti mərhələ
                </Button>
              )}
              {order.payment_method === "cash" && order.payment_status !== "completed" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => startTransition(() => markPaymentReceivedAction(order.id))}
                >
                  Ödəniş alındı
                </Button>
              )}
              {order.status === "pending" && (
                <Button size="sm" variant="danger" disabled={isPending} onClick={() => startTransition(() => cancelOrderAction(order.id))}>
                  Ləğv et
                </Button>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
