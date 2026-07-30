"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const VALID_CATEGORIES = ["inventory_purchase", "salary", "rent", "utility", "other"];

/**
 * Yeni xerc qeydi: anbar alishi (mes. Coca-Cola-dan mal), ishci maaşı,
 * kira/kommunal ve ya diger. Butun kateqoriyalar EYNI cedvelde (expenses)
 * saxlanilir ki, hesabatda Gelir-Xerc=Qazanc bir yerden hesablansin.
 * Yalniz owner/manager - RLS (expenses_owner_manager_all) bunu DB
 * seviyyesinde de tekrar yoxlayir (defense in depth).
 */
export async function addExpenseAction(formData: FormData) {
  const context = await getCurrentStaffContext();
  if (context.role !== "owner" && context.role !== "manager") {
    redirect("/reports?error=" + encodeURIComponent("Xərc əlavə etmək icazəniz yoxdur"));
  }

  const category = String(formData.get("category") ?? "");
  const amount = Number(formData.get("amount"));
  const description = String(formData.get("description") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const staffMemberId = String(formData.get("staff_member_id") ?? "").trim();
  const expenseDate = String(formData.get("expense_date") ?? "").trim();

  if (!VALID_CATEGORIES.includes(category)) {
    redirect("/reports?error=" + encodeURIComponent("Xərc kateqoriyası düzgün seçilməyib"));
  }
  if (!amount || amount <= 0) {
    redirect("/reports?error=" + encodeURIComponent("Məbləğ düzgün deyil"));
  }

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("expenses").insert({
    restaurant_id: context.restaurantId,
    category: category as "inventory_purchase" | "salary" | "rent" | "utility" | "other",
    amount,
    description: description || null,
    supplier_id: category === "inventory_purchase" && supplierId ? supplierId : null,
    staff_member_id: category === "salary" && staffMemberId ? staffMemberId : null,
    expense_date: expenseDate || new Date().toISOString().slice(0, 10),
    created_by: user?.id ?? null,
  });

  if (error) {
    redirect("/reports?error=" + encodeURIComponent("Xərc yadda saxlanıla bilmədi"));
  }

  revalidatePath("/reports");
  redirect("/reports?saved=1");
}

export async function deleteExpenseAction(expenseId: string) {
  const context = await getCurrentStaffContext();
  if (context.role !== "owner" && context.role !== "manager") return;

  const supabase = getSupabaseServerClient();
  await supabase.from("expenses").delete().eq("id", expenseId).eq("restaurant_id", context.restaurantId);

  revalidatePath("/reports");
}
