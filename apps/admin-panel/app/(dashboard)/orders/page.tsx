import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { OrdersRealtimeList } from "@/components/orders/OrdersRealtimeList";

export const metadata = { title: "Sifarişlər" };

export default async function OrdersPage() {
  const { restaurantId, role } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();

  const [{ data: orders }, { data: courierStaff }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, order_number, status, order_type, total, discount_amount, created_at, table_id, delivery_address, courier_id, courier_name, courier_phone"
      )
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(50),
    (
      supabase as unknown as {
        rpc: (fn: string, args: unknown) => Promise<{ data: { id: string; full_name: string | null; role: string }[] | null }>;
      }
    ).rpc("get_staff_list", { _restaurant_id: restaurantId }),
  ]);

  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: payments } = orderIds.length
    ? await supabase.from("payments").select("order_id, method, status").in("order_id", orderIds)
    : { data: [] };
  const paymentByOrder = new Map((payments ?? []).map((p) => [p.order_id, p]));

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
    payment_method: paymentByOrder.get(o.id)?.method ?? null,
    payment_status: paymentByOrder.get(o.id)?.status ?? null,
    delivery_address: o.delivery_address,
    courier_id: o.courier_id,
    courier_name: o.courier_name,
    courier_phone: o.courier_phone,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Sifarişlər</h1>
        <p className="text-sm text-text-secondary">Son 50 sifariş, canlı yenilənir</p>
      </div>
      <OrdersRealtimeList restaurantId={restaurantId} initialOrders={orderRows} couriers={couriers} role={role} />
    </div>
  );
}
