"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Xerc qeydini silir. Bu action ortaqdir - hem Hesabatlar, hem Xerclər
 * sehifesindeki DeleteExpenseButton bunu cagirir (bax: components/reports/
 * DeleteExpenseButton.tsx), cunki hamisi eyni `expenses` cedvelinin
 * uzerinde ishleyir.
 */
export async function deleteExpenseAction(expenseId: string) {
  const context = await getCurrentStaffContext();
  if (context.role !== "owner" && context.role !== "manager") return;

  const supabase = getSupabaseServerClient();
  await supabase.from("expenses").delete().eq("id", expenseId).eq("restaurant_id", context.restaurantId);

  revalidatePath("/reports");
  revalidatePath("/expenses");
}
