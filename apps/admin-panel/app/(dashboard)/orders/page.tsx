import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { OrdersRealtimeList } from "@/components/orders/OrdersRealtimeList";

type PaymentLite = { order_id: string; method: string; status: string; amount: number };

function summarizeMethod(rows?: PaymentLite[]) {
  if (!rows?.length) return null;
  const done = rows.filter((r) => r.status === "completed");
  const methods = new Set((done.length ? done : rows).map((r) => r.method));
  return methods.size > 1 ? "split" : [...methods][0];
}

function summarizeStatus(rows?: PaymentLite[]) {
  if (!rows?.length) return null;
  return rows.every((r) => r.status === "completed") ? "completed" : rows[0].status;
}

function sumMethod(rows: PaymentLite[] | undefined, method: string) {
  return (rows ?? []).filter((r) => r.method === method && r.status === "completed").reduce((a, r) => a + Number(r.amount), 0);
}

export const metadata = { title: "Sifarişlər" };

export default async function OrdersPage() {
  const { restaurantId, role, staffId } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();

  let ordersQuery = supabase
    .from("orders")
    .select(
      "id, order_number, status, order_type, total, discount_amount, created_at, table_id, delivery_address, courier_id, courier_name, courier_phone, picked_up_at, ready_at"
    )
    .eq("restaurant_id", restaurantId);

  if (role === "courier") {
    ordersQuery = ordersQuery
      .eq("order_type", "delivery")
      .or(`courier_id.eq.${staffId},courier_id.is.null`)
      .not("status", "in", "(completed,cancelled)");
  }

  const [{ data: orders }, { data: courierStaff }] = await Promise.all([
    ordersQuery.order("created_at", { ascending: false }).limit(50),
    (
      supabase as unknown as {
        rpc: (fn: string, args: unknown) => Promise<{ data: { id: string; full_name: string | null; role: string }[] | null }>;
      }
    ).rpc("get_staff_list", { _restaurant_id: restaurantId }),
  ]);

  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: payments } = orderIds.length
    ? await supabase.from("payments").select("order_id, method, status, amount").in("order_id", orderIds)
    : { data: [] };
  const paymentsByOrder = new Map<string, NonNullable<typeof payments>>();
  for (const p of payments ?? []) paymentsByOrder.set(p.order_id, [...(paymentsByOrder.get(p.order_id) ?? []), p]);

  const { data: tips } = orderIds.length
    ? await (
        supabase as unknown as {
          from: (t: "order_tips") => {
            select: (c: string) => { in: (c: string, v: string[]) => Promise<{ data: { order_id: string; amount: number }[] | null }> };
          };
        }
      )
        .from("order_tips")
        .select("order_id, amount")
        .in("order_id", orderIds)
    : { data: [] };
  const tipByOrder = new Map((tips ?? []).map((t) => [t.order_id, Number(t.amount)]));

  const tableIds = [...new Set((orders ?? []).map((o) => o.table_id).filter(Boolean))] as string[];
  const { data: tables } = tableIds.length
    ? await supabase.from("restaurant_tables").select("id, table_number").in("id", tableIds)
    : { data: [] };
  const tableNumberById = new Map((tables ?? []).map((t) => [t.id, t.table_number]));

  const couriers = (courierStaff ?? []).filter((s) => s.role === "courier");

  const orderRows = (orders ?? []).map((o) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    order_type: o.order_type,
    total: o.total,
    discount_amount: o.discount_amount,
    created_at: o.created_at,
    table_number: o.table_id ? tableNumberById.get(o.table_id) ?? null : null,
    payment_method: summarizeMethod(paymentsByOrder.get(o.id)),
    payment_status: summarizeStatus(paymentsByOrder.get(o.id)),
    payment_cash: sumMethod(paymentsByOrder.get(o.id), "cash"),
    payment_card: sumMethod(paymentsByOrder.get(o.id), "card"),
    tip_amount: tipByOrder.get(o.id) ?? 0,
    delivery_address: o.delivery_address,
    courier_id: o.courier_id,
    courier_name: o.courier_name,
    courier_phone: o.courier_phone,
    picked_up_at: o.picked_up_at,
    ready_at: o.ready_at,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Sifarişlər</h1>
        <p className="text-sm text-text-secondary">Son 50 sifariş, canlı yenilənir</p>
      </div>
      <OrdersRealtimeList restaurantId={restaurantId} initialOrders={orderRows} couriers={couriers} waiters={(courierStaff ?? []).filter((s) => s.role === "waiter")} role={role} staffId={staffId} />
    </div>
  );
}
