"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";

type ReservationStatus = "pending" | "confirmed" | "seated" | "cancelled" | "no_show";

async function updateStatus(reservationId: string, status: ReservationStatus) {
  const { restaurantId } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();
  await supabase
    .from("reservations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", reservationId)
    .eq("restaurant_id", restaurantId);
  revalidatePath("/reservations");
}

export async function confirmReservationAction(reservationId: string) {
  await updateStatus(reservationId, "confirmed");
}

export async function seatReservationAction(reservationId: string, tableId: string | null) {
  const { restaurantId } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();
  await supabase
    .from("reservations")
    .update({ status: "seated", table_id: tableId, updated_at: new Date().toISOString() })
    .eq("id", reservationId)
    .eq("restaurant_id", restaurantId);
  revalidatePath("/reservations");
}

export async function cancelReservationAction(reservationId: string) {
  await updateStatus(reservationId, "cancelled");
}

export async function markNoShowAction(reservationId: string) {
  await updateStatus(reservationId, "no_show");
}
