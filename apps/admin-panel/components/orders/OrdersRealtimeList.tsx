"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Badge, Button, Sticker } from "@restoran/ui";
import { MapPin, Receipt, Tag } from "lucide-react";
import { createSupabaseBrowserClient } from "@restoran/supabase-client";
import {
  cancelOrderAction,
  markPaymentReceivedAction,
  closeOrderAction,
  markOrderServedAction,
  courierDeliveryStepAction,
} from "@/app/(dashboard)/orders/actions";
import { CourierAssignment } from "@/components/orders/CourierAssignment";
import { OrderDiscountForm } from "@/components/orders/OrderDiscountForm";
import { PaymentSettleForm } from "@/components/orders/PaymentSettleForm";

interface OrderRow {
  id: string;
  order_number: number;
  status: string;
  order_type: string;
  total: number;
  discount_amount: number;
  created_at: string;
  table_number: string | null;
  payment_method: string | null;
  payment_status: string | null;
  delivery_address: string | null;
  courier_id: string | null;
  courier_name: string | null;
  courier_phone: string | null;
  picked_up_at: string | null;
  ready_at: string | null;
  payment_cash: number;
  payment_card: number;
  tip_amount: number;
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Nağd",
  card: "Kart",
  online: "Onlayn",
  split: "Bölünmüş",
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

const UNCLAIMED_AFTER_MINUTES = 30;

export function OrdersRealtimeList({
  restaurantId,
  initialOrders,
  couriers,
  waiters,
  role,
  staffId,
}: {
  restaurantId: string;
  initialOrders: OrderRow[];
  couriers: { id: string; full_name: string | null }[];
  waiters: { id: string; full_name: string | null }[];
  role: string;
  staffId: string;
}) {
  const router = useRouter();
  const canDiscount = role === "owner" || role === "manager";
  const isManagement = role === "owner" || role === "manager";
  const canServe = isManagement || role === "waiter";
  const canTakePayment = isManagement || role === "cashier";
  const isCourier = role === "courier";
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const [orders, setOrders] = useState(initialOrders);
  const [openDiscountId, setOpenDiscountId] = useState<string | null>(null);
  const [openSettleId, setOpenSettleId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Ehtiyat: server (Next.js) yeni initialOrders-le render etsə (mes.
  // baska sebeble sehife yenidense) - client-deki local state de
  // sinxronlasin. Adeten Realtime bunu artiq edir, bu YALNIZ elave
  // tehlukesizlikdir.
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        // DIQQET: `payload.new` sifarişin BUTUN sutunlarini (status,
        // courier_id, courier_name, courier_phone, delivery_address,
        // total ve s.) ehtiva edir - evvelki versiya YALNIZ `status`-u
        // goturürdu, ona gore kuryer teyinati kimi deyisikliklər canli
        // gorunmurdu (yeniden yuklemek lazim gelirdi). Indi TAM setiri
        // birleşdiririk - `table_number`/`payment_method`/`payment_status`
        // kimi JOIN-le gelen sahələr toxunulmaz qalir (payload.new-de
        // olmadigi ucun).
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? ({ ...o, ...updated } as OrderRow) : o)));
        }
      )
      .on(
        // Ozunda "orders" statusu canli yenilense de, ODENIŞ (payments
        // cedveli) AYRI cedveldir - evvelki versiyada bura abune
        // olunmurdu, ona gore odenis nisani sehife ILK yuklendiyi anin
        // melumatinda "ilişib" qalirdi (mes. status canli "Tamamlandı"
        // gorunur, amma odenis hele "Gözləyir" - kohnelmiş ekran).
        "postgres_changes",
        { event: "*", schema: "public", table: "payments", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, router]);

  if (orders.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Sticker name="coffee-cup" size={80} />
          <p className="text-sm text-text-secondary">Hələ sifariş yoxdur</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <Card key={order.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-text-muted">
                #{order.order_number} ·{" "}
                {new Date(order.created_at).toLocaleDateString("az-AZ", { day: "numeric", month: "short" })}
              </span>
              <Badge variant={STATUS_BADGE[order.status] ?? "neutral"}>{STATUS_LABEL[order.status] ?? order.status}</Badge>
              {order.order_type === "delivery" && order.picked_up_at && order.status === "ready" && (
                <Badge variant="info">Yolda</Badge>
              )}
              {order.order_type === "takeaway" && order.status === "ready" && order.ready_at && (
                <>
                  <Badge variant="accent">Müştəri gözlənilir</Badge>
                  {(now - new Date(order.ready_at).getTime()) / 60_000 >= UNCLAIMED_AFTER_MINUTES && (
                    <Badge variant="danger">
                      Götürülməyib · {Math.floor((now - new Date(order.ready_at).getTime()) / 60_000)} dəq
                    </Badge>
                  )}
                </>
              )}
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              {order.table_number ? `Masa ${order.table_number}` : order.order_type === "takeaway" ? "Özün apar" : "Çatdırılma"}
              {" · "}
              {order.discount_amount > 0 ? (
                <>
                  <span className="text-text-muted line-through">{Number(order.total).toFixed(2)} ₼</span>{" "}
                  {(Number(order.total) - Number(order.discount_amount)).toFixed(2)} ₼
                  <span className="ml-1 text-xs text-success">(-{Number(order.discount_amount).toFixed(2)} ₼ endirim)</span>
                </>
              ) : (
                `${Number(order.total).toFixed(2)} ₼`
              )}
              {order.payment_method && (
                <>
                  {" · "}
                  {PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method}
                  {order.payment_method === "split" && ` (nağd ${Number(order.payment_cash).toFixed(2)} + kart ${Number(order.payment_card).toFixed(2)})`}
                  {order.payment_status === "completed" ? (
                    <Badge variant="success" className="ml-1">Ödənilib</Badge>
                  ) : (
                    <Badge variant="warning" className="ml-1">Gözləyir</Badge>
                  )}
                </>
              )}
            </p>
            {Number(order.tip_amount) > 0 && (
              <p className="text-xs text-text-secondary">Çay pulu: {Number(order.tip_amount).toFixed(2)} ₼ (gəlirə daxil deyil)</p>
            )}
            {order.order_type === "delivery" && order.delivery_address && (
              <p className="mt-1 flex items-start gap-1 break-words text-xs text-text-muted">
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

            {canDiscount && order.status !== "cancelled" && (
              <div className="flex flex-col items-end gap-1.5">
                {openDiscountId === order.id ? (
                  <OrderDiscountForm orderId={order.id} onApplied={() => setOpenDiscountId(null)} />
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenDiscountId(order.id)}
                    className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-accent"
                  >
                    <Tag className="h-3 w-3" aria-hidden="true" /> Endirim
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Link
                href={`/orders/${order.id}/receipt`}
                target="_blank"
                className="flex items-center gap-1.5 rounded-md border border-border-strong px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-muted"
              >
                <Receipt className="h-3.5 w-3.5" aria-hidden="true" /> Qəbz
              </Link>
              {ACTIVE_STATUSES.has(order.status) && order.status === "ready" && order.order_type === "dine_in" && canServe && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => startTransition(() => markOrderServedAction(order.id))}
                >
                  Stola verildi
                </Button>
              )}
              {order.order_type === "delivery" && (isCourier || isManagement) && ACTIVE_STATUSES.has(order.status) && (
                <>
                  {isCourier && !order.courier_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => startTransition(() => courierDeliveryStepAction(order.id, "claim"))}
                    >
                      Mən aparıram
                    </Button>
                  )}
                  {order.status === "ready" && !order.picked_up_at && (!isCourier || order.courier_id === staffId) && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => startTransition(() => courierDeliveryStepAction(order.id, "picked_up"))}
                    >
                      Götürdüm, yoldayam
                    </Button>
                  )}
                  {order.status === "ready" && order.picked_up_at && (!isCourier || order.courier_id === staffId) && (
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => startTransition(() => courierDeliveryStepAction(order.id, "delivered"))}
                    >
                      Çatdırıldı
                    </Button>
                  )}
                </>
              )}
              {(order.status === "served" || order.status === "ready") &&
                (canTakePayment ||
                  (isCourier && order.order_type === "delivery" && order.courier_id === staffId && order.status === "served")) &&
                order.payment_status !== "completed" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => startTransition(() => markPaymentReceivedAction(order.id, "cash"))}
                    >
                      Nağd alındı
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => startTransition(() => markPaymentReceivedAction(order.id, "card"))}
                    >
                      Kartla alındı
                    </Button>
                    {canTakePayment && (
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => setOpenSettleId(order.id)}>
                        Bölünmüş / çay pulu
                      </Button>
                    )}
                  </>
                )}
              {openSettleId === order.id && canTakePayment && order.payment_status !== "completed" && (
                <PaymentSettleForm
                  orderId={order.id}
                  due={Math.round((Number(order.total) - Number(order.discount_amount)) * 100) / 100}
                  defaultWaiterId={null}
                  waiters={waiters}
                  onDone={() => setOpenSettleId(null)}
                />
              )}
              {ACTIVE_STATUSES.has(order.status) && order.status === "served" && order.payment_status === "completed" && canTakePayment && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => startTransition(() => closeOrderAction(order.id))}
                >
                  Sifarişi bağla
                </Button>
              )}
              {ACTIVE_STATUSES.has(order.status) &&
                order.payment_status !== "completed" &&
                !isCourier &&
                (order.status === "pending" || (isManagement && order.status !== "served")) && (
                <Button size="sm" variant="danger" disabled={isPending} onClick={() => {
                    const reason = window.prompt("Ləğv səbəbi nədir?");
                    if (reason && reason.trim().length >= 3) startTransition(() => cancelOrderAction(order.id, reason));
                  }}>
                  Ləğv et
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
