"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";

const NEXT_STATUS: Record<string, "confirmed" | "preparing" | "ready" | "served" | "completed"> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "served",
  served: "completed",
};

export async function advanceOrderStatusAction(orderId: string, currentStatus: string) {
  const { restaurantId } = await getCurrentStaffContext();
  const nextStatus = NEXT_STATUS[currentStatus];
  if (!nextStatus) return;

  const supabase = getSupabaseServerClient();
  await supabase.from("orders").update({ status: nextStatus }).eq("id", orderId).eq("restaurant_id", restaurantId);
  revalidatePath("/orders");
}

export async function cancelOrderAction(orderId: string) {
  const { restaurantId } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();
  await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId).eq("restaurant_id", restaurantId);
  revalidatePath("/orders");
}

export async function markPaymentReceivedAction(orderId: string) {
  const { restaurantId } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();
  await supabase
    .from("payments")
    .update({ status: "completed" })
    .eq("order_id", orderId)
    .eq("restaurant_id", restaurantId);
  revalidatePath("/orders");
}
