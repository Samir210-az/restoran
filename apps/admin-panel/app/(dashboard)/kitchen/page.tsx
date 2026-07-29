import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { KitchenBoard } from "@/components/kitchen/KitchenBoard";

export const metadata = { title: "Mətbəx Ekranı" };

interface LocalizedText {
  az?: string;
  en?: string;
}

/**
 * Aktiv sifarislerin (legv/tamamlanmamis) mehsullarini toplayir ve
 * KitchenBoard-a ötürür. Ilkin melumat serverde (SSR) yuklenir,
 * sonraki yenilemeler KitchenBoard daxilindeki Realtime abunelikle gelir.
 */
export default async function KitchenPage() {
  const { restaurantId } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();

  const { data: activeOrders } = await supabase
    .from("orders")
    .select("id, table_id")
    .eq("restaurant_id", restaurantId)
    .not("status", "in", "(cancelled,completed)");

  const orderIds = (activeOrders ?? []).map((o) => o.id);
  const tableIdByOrder = new Map((activeOrders ?? []).map((o) => [o.id, o.table_id]));

  const tableIds = [...new Set((activeOrders ?? []).map((o) => o.table_id).filter(Boolean))] as string[];
  const { data: tables } = tableIds.length
    ? await supabase.from("restaurant_tables").select("id, table_number").in("id", tableIds)
    : { data: [] };
  const tableNumberById = new Map((tables ?? []).map((t) => [t.id, t.table_number]));

  const { data: orderItems } = orderIds.length
    ? await supabase
        .from("order_items")
        .select("id, order_id, quantity, kitchen_status, special_instructions, created_at, menu_items(name)")
        .in("order_id", orderIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const items = (orderItems ?? []).map((row) => {
    const menuItem = Array.isArray(row.menu_items) ? row.menu_items[0] : row.menu_items;
    const tableId = tableIdByOrder.get(row.order_id) ?? null;
    return {
      id: row.id,
      order_id: row.order_id,
      quantity: row.quantity,
      kitchen_status: row.kitchen_status as "queued" | "cooking" | "ready",
      special_instructions: row.special_instructions,
      created_at: row.created_at,
      menu_item_name: (menuItem?.name as LocalizedText)?.az ?? "Məhsul",
      table_number: tableId ? tableNumberById.get(tableId) ?? null : null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Mətbəx Ekranı</h1>
        <p className="text-sm text-text-secondary">Sifarişlər avtomatik, canlı yenilənir</p>
      </div>
      <KitchenBoard restaurantId={restaurantId} initialItems={items} />
    </div>
  );
}
