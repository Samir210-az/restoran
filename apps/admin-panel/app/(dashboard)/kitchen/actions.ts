"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";

const KITCHEN_ROLES = ["owner", "manager", "chef"];
const BAR_ROLES = ["owner", "manager", "cashier", "waiter"];

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
 *
 * Bar mehsullari (su, kola) metbexe dusmur: bar ekraninda birbasa
 * queued -> ready edilir (bax: /bar). Sifaris ancaq metbex VE bar
 * hissesi tam hazir olanda "ready" olur.
 */
export async function advanceKitchenItemStatusAction(itemId: string, currentStatus: string) {
  const { restaurantId, role } = await getCurrentStaffContext();

  const supabase = getSupabaseServerClient();

  const { data: item } = await supabase
    .from("order_items")
    .select("order_id, station, kitchen_status")
    .eq("id", itemId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (!item) return;

  const allowedRoles = item.station === "bar" ? BAR_ROLES : KITCHEN_ROLES;
  if (!allowedRoles.includes(role)) {
    throw new Error("FORBIDDEN: bu ekranda əməliyyat etmək icazəniz yoxdur");
  }

  const nextStatus = item.station === "bar" && currentStatus === "queued" ? "ready" : NEXT_STATUS[currentStatus];
  if (!nextStatus || item.kitchen_status !== currentStatus) return;

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
  revalidatePath("/bar");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}
