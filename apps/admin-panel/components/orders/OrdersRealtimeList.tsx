"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, Badge, Button } from "@restoran/ui";
import { MapPin } from "lucide-react";
import { createSupabaseBrowserClient } from "@restoran/supabase-client";
import { advanceOrderStatusAction, cancelOrderAction, markPaymentReceivedAction } from "@/app/(dashboard)/orders/actions";
import { CourierAssignment } from "@/components/orders/CourierAssignment";

interface OrderRow {
  id: string;
  order_number: number;
  status: string;
  order_type: string;
  total: number;
  created_at: string;
  table_number: string | null;
  payment_method: string | null;
  payment_status: string | null;
  delivery_address: string | null;
  courier_id: string | null;
  courier_name: string | null;
  courier_phone: string | null;
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

export function OrdersRealtimeList({
  restaurantId,
  initialOrders,
  couriers,
}: {
  restaurantId: string;
  initialOrders: OrderRow[];
  couriers: { id: string; full_name: string | null }[];
}) {
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
              <span className="font-mono text-xs text-text-muted">
                #{order.order_number} ·{" "}
                {new Date(order.created_at).toLocaleDateString("az-AZ", { day: "numeric", month: "short" })}
              </span>
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
            {order.order_type === "delivery" && order.delivery_address && (
              <p className="mt-1 flex items-start gap-1 text-xs text-text-muted">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                {order.delivery_address}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {order.order_type === "delivery" && ACTIVE_STATUSES.has(order.status) && (
              <CourierAssignment
                orderId={order.id}
                couriers={couriers}
                currentCourierId={order.courier_id}
                currentCourierName={order.courier_name}
                currentCourierPhone={order.courier_phone}
              />
            )}

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
              {(order.payment_method === "cash" || order.payment_method === "card") && order.payment_status !== "completed" && (
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
          </div>
        </Card>
      ))}
    </div>
  );
}
