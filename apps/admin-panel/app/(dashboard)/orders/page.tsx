import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { OrdersRealtimeList } from "@/components/orders/OrdersRealtimeList";

export const metadata = { title: "Sifarişlər" };

export default async function OrdersPage() {
  const { restaurantId } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, order_type, total, created_at, table_id")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(50);

  const tableIds = [...new Set((orders ?? []).map((o) => o.table_id).filter(Boolean))] as string[];
  const { data: tables } = tableIds.length
    ? await supabase.from("restaurant_tables").select("id, table_number").in("id", tableIds)
    : { data: [] };
  const tableNumberById = new Map((tables ?? []).map((t) => [t.id, t.table_number]));

  const orderRows = (orders ?? []).map((o) => ({
    id: o.id,
    status: o.status,
    order_type: o.order_type,
    total: o.total,
    created_at: o.created_at,
    table_number: o.table_id ? tableNumberById.get(o.table_id) ?? null : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Sifarişlər</h1>
        <p className="text-sm text-text-secondary">Son 50 sifariş, canlı yenilənir</p>
      </div>
      <OrdersRealtimeList restaurantId={restaurantId} initialOrders={orderRows} />
    </div>
  );
}
