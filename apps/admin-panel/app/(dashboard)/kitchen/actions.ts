"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";

const NEXT_STATUS: Record<string, "cooking" | "ready"> = {
  queued: "cooking",
  cooking: "ready",
};

const ORDER_STATUS_RANK: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  served: 4,
  completed: 5,
  cancelled: -1,
};

/**
 * Mehsulun metbex statusunu bir addim ireli aparir (queued -> cooking -> ready).
 * `restaurant_id` manual olaraq da yoxlanilir (defence in depth) - RLS
 * (`order_items_staff_all`) artiq bunu tetbiq edir, amma iki qat qoruma
 * yanlish restorana yazmagin qarsisini alir.
 *
 * SINXRONIZASIYA: mehsul statusu ile sifarisin umumi statusu (orders.status)
 * bir-birinden ASILI DEYIL idi - metbexde "hazir" edende sifaris hele
 * "hazirlanir"da qalirdi, bu da qarisiqliq yaradirdi. Indi:
 * - ilk mehsul "cooking"e kecende sifaris "preparing"e qalxir (eger geridedirse)
 * - BUTUN mehsullar "ready" olanda sifaris "ready"e qalxir (eger geridedirse)
 */
export async function advanceKitchenItemStatusAction(itemId: string, currentStatus: string) {
  const { restaurantId } = await getCurrentStaffContext();
  const nextStatus = NEXT_STATUS[currentStatus];
  if (!nextStatus) return;

  const supabase = getSupabaseServerClient();

  const { data: item } = await supabase
    .from("order_items")
    .select("order_id")
    .eq("id", itemId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (!item) return;

  await supabase
    .from("order_items")
    .update({ kitchen_status: nextStatus })
    .eq("id", itemId)
    .eq("restaurant_id", restaurantId);

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", item.order_id)
    .maybeSingle();

  if (order && ORDER_STATUS_RANK[order.status] >= 0) {
    if (nextStatus === "cooking" && ORDER_STATUS_RANK[order.status] < ORDER_STATUS_RANK["preparing"]) {
      await supabase.from("orders").update({ status: "preparing" }).eq("id", item.order_id);
    }

    if (nextStatus === "ready" && ORDER_STATUS_RANK[order.status] < ORDER_STATUS_RANK["ready"]) {
      const { data: siblingItems } = await supabase
        .from("order_items")
        .select("kitchen_status")
        .eq("order_id", item.order_id);

      const allReady = (siblingItems ?? []).every((i) => i.kitchen_status === "ready");
      if (allReady) {
        await supabase.from("orders").update({ status: "ready" }).eq("id", item.order_id);
      }
    }
  }

  revalidatePath("/kitchen");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}
