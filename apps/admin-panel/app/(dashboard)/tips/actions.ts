"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getTipBalances } from "@/lib/tips-report";

function back(message: string, kind: "error" | "saved" = "error"): never {
  redirect(`/tips?${kind}=${encodeURIComponent(message)}`);
}

export async function payTipAction(formData: FormData) {
  const { restaurantId, role, userId, fullName } = await getCurrentStaffContext();
  if (role !== "owner" && role !== "manager" && role !== "cashier") back("Bu əməliyyat üçün icazəniz yoxdur");

  const waiterId = String(formData.get("waiter_id") ?? "");
  const amount = Math.round(Number(String(formData.get("amount") ?? "").replace(",", ".")) * 100) / 100;
  if (!waiterId || !Number.isFinite(amount) || amount <= 0) back("Məbləği düzgün yazın");

  const balance = (await getTipBalances(restaurantId)).find((b) => b.waiterId === waiterId)?.balance ?? 0;
  if (amount > balance) back(`Ofisiantın qalığı ${balance.toFixed(2)} ₼-dir, daha çox verilə bilməz`);

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("tip_payouts" as never).insert({
    restaurant_id: restaurantId,
    waiter_id: waiterId,
    amount,
    paid_by: userId,
    paid_by_name: fullName,
  } as never);
  if (error) back("Qeyd olunmadı, yenidən cəhd edin");

  revalidatePath("/tips");
  revalidatePath("/cash");
  back("Ofisiantın payı verildi kimi qeyd olundu", "saved");
}
