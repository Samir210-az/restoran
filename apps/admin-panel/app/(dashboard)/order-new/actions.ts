"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";

interface CartLine {
  menuItemId: string;
  quantity: number;
}

/**
 * Ofisiant/kassir masa ucun sifaris yaradir. Eyni `place_order` RPC-sini
 * (musteri terefi ile eyni) istifade edir - amma bu defe `_placed_by`
 * 'waiter' olaraq qeyd olunur ki, hesabatlarda ferqlendirile bilsin.
 */
export async function createWaiterOrderAction(params: {
  tableId: string | null;
  items: CartLine[];
}) {
  const { restaurantId, userId } = await getCurrentStaffContext();
  if (params.items.length === 0) return;

  const supabase = getSupabaseServerClient();

  const lines = params.items.map((line) => ({ menu_item_id: line.menuItemId, quantity: line.quantity }));

  if (params.tableId) {
    const { data: openOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("table_id", params.tableId)
      .not("status", "in", "(completed,cancelled)")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (openOrder) {
      const { error: addError } = await supabase.rpc("add_items_to_order", {
        _order_id: openOrder.id,
        _items: lines,
      });
      if (addError) throw new Error("Məhsullar sifarişə əlavə olunmadı: " + addError.message);

      revalidatePath("/orders");
      revalidatePath("/kitchen");
      revalidatePath("/bar");
      revalidatePath(`/tables/${params.tableId}`);
      redirect("/orders");
    }
  }

  const { data, error } = await (
    supabase as unknown as {
      rpc: (fn: string, args: unknown) => Promise<{ data: { order_id: string }[] | null; error: unknown }>;
    }
  ).rpc("place_order", {
    _restaurant_id: restaurantId,
    _table_id: params.tableId,
    _order_type: params.tableId ? "dine_in" : "takeaway",
    _items: lines,
    _payment_method: "cash",
    _placed_by: "waiter",
    _created_by: userId,
  });

  if (error || !data?.[0]) return;

  revalidatePath("/orders");
  revalidatePath("/kitchen");
  revalidatePath("/bar");
  redirect("/orders");
}
