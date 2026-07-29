"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";

const NEXT_STATUS: Record<string, "cooking" | "ready"> = {
  queued: "cooking",
  cooking: "ready",
};

/**
 * Mehsulun metbex statusunu bir addim ireli aparir (queued -> cooking -> ready).
 * `restaurant_id` manual olaraq da yoxlanilir (defence in depth) - RLS
 * (`order_items_staff_all`) artiq bunu tetbiq edir, amma iki qat qoruma
 * yanlish restorana yazmagin qarsisini alir.
 */
export async function advanceKitchenItemStatusAction(itemId: string, currentStatus: string) {
  const { restaurantId } = await getCurrentStaffContext();
  const nextStatus = NEXT_STATUS[currentStatus];
  if (!nextStatus) return;

  const supabase = getSupabaseServerClient();
  await supabase
    .from("order_items")
    .update({ kitchen_status: nextStatus })
    .eq("id", itemId)
    .eq("restaurant_id", restaurantId);

  revalidatePath("/kitchen");
  revalidatePath("/orders");
}
