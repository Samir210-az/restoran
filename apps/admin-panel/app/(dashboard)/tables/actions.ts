"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";

export async function createTableAction(formData: FormData) {
  const { restaurantId } = await getCurrentStaffContext();
  const tableNumber = String(formData.get("table_number") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 2);
  if (!tableNumber) return;

  const supabase = getSupabaseServerClient();

  const { data: branch } = await supabase
    .from("branches")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!branch) return;

  await supabase.from("restaurant_tables").insert({
    restaurant_id: restaurantId,
    branch_id: branch.id,
    table_number: tableNumber,
    capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : 2,
  });

  revalidatePath("/tables");
}
