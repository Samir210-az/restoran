"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getOpenShift, getShiftTotals } from "@/lib/cash-shift";

const CASH_ROLES = ["owner", "manager", "cashier"];

function back(message: string, kind: "error" | "saved" = "error"): never {
  redirect(`/cash?${kind}=${encodeURIComponent(message)}`);
}

function parseMoney(value: FormDataEntryValue | null) {
  const amount = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : null;
}

export async function openShiftAction(formData: FormData) {
  const { restaurantId, role, userId, fullName } = await getCurrentStaffContext();
  if (!CASH_ROLES.includes(role)) back("Növbəni yalnız kassir, menecer və sahib aça bilər");

  const openingCash = parseMoney(formData.get("opening_cash"));
  if (openingCash === null) back("Kassadakı başlanğıc məbləği düzgün yazın");

  if (await getOpenShift(restaurantId)) back("Açıq növbə artıq var");

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("cash_shifts" as never).insert({
    restaurant_id: restaurantId,
    opened_by: userId,
    opened_by_name: fullName,
    opening_cash: openingCash,
  } as never);
  if (error) back("Növbə açılmadı, bir az sonra yenidən cəhd edin");

  revalidatePath("/cash");
  back("Növbə açıldı", "saved");
}

export async function closeShiftAction(formData: FormData) {
  const { restaurantId, role, userId, fullName } = await getCurrentStaffContext();
  if (!CASH_ROLES.includes(role)) back("Növbəni yalnız kassir, menecer və sahib bağlaya bilər");

  const counted = parseMoney(formData.get("counted_cash"));
  if (counted === null) back("Kassada saydığınız məbləği düzgün yazın");
  const note = String(formData.get("note") ?? "").trim().slice(0, 300) || null;

  const shift = await getOpenShift(restaurantId);
  if (!shift) back("Açıq növbə yoxdur");

  const closedAt = new Date().toISOString();
  const totals = await getShiftTotals(restaurantId, shift!.opened_at, closedAt);
  const expected = Math.round((Number(shift!.opening_cash) + totals.cash + totals.cashTips) * 100) / 100;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("cash_shifts" as never)
    .update({
      closed_at: closedAt,
      closed_by: userId,
      closed_by_name: fullName,
      expected_cash: expected,
      counted_cash: counted,
      note,
    } as never)
    .eq("id", shift!.id)
    .eq("restaurant_id", restaurantId)
    .is("closed_at", null);
  if (error) back("Növbə bağlanmadı, bir az sonra yenidən cəhd edin");

  revalidatePath("/cash");
  back("Növbə bağlandı", "saved");
}
