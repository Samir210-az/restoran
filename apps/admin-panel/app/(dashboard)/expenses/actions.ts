"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const VALID_CATEGORIES = ["supplier_payment", "rent", "utility", "tax", "other"];

/**
 * BU sehife anbar alishini (Anbar bolmesinde, mal medaxili ile birlikde)
 * ve maaş odenishini (Isciler bolmesinde, konkret ishciye baglanmiş)
 * QESDEN EHATE ETMIR - onlar öz bolmelerinde daha mentiqlidir. Burada
 * YALNIZ heç bir basqa bolmeye aid olmayan xerc novleri: techizatçiya
 * BIRBASA odenish (mal olmadan, mes. kohne borc), kira, kommunal,
 * vergi, diger. Hamisi eyni `expenses` cedveline yazilir - Hesabatlar
 * sehifesi bunlarin HAMISINI (bu bolmeden + Anbar + Isciler-den gelenleri)
 * bir yerde gosterir.
 */
export async function addExpenseAction(formData: FormData) {
  const context = await getCurrentStaffContext();
  if (context.role !== "owner" && context.role !== "manager") {
    redirect("/expenses?error=" + encodeURIComponent("Xərc əlavə etmək icazəniz yoxdur"));
  }

  const category = String(formData.get("category") ?? "");
  const amount = Number(formData.get("amount"));
  const description = String(formData.get("description") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const expenseDate = String(formData.get("expense_date") ?? "").trim();

  if (!VALID_CATEGORIES.includes(category)) {
    redirect("/expenses?error=" + encodeURIComponent("Xərc kateqoriyası düzgün seçilməyib"));
  }
  if (!amount || amount <= 0) {
    redirect("/expenses?error=" + encodeURIComponent("Məbləğ düzgün deyil"));
  }

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("expenses").insert({
    restaurant_id: context.restaurantId,
    category: category as "supplier_payment" | "rent" | "utility" | "tax" | "other",
    amount,
    description: description || null,
    supplier_id: category === "supplier_payment" && supplierId ? supplierId : null,
    expense_date: expenseDate || new Date().toISOString().slice(0, 10),
    created_by: user?.id ?? null,
  });

  if (error) {
    redirect("/expenses?error=" + encodeURIComponent("Xərc yadda saxlanıla bilmədi"));
  }

  revalidatePath("/expenses");
  revalidatePath("/reports");
  redirect("/expenses?saved=1");
}

export async function deleteExpenseAction(expenseId: string) {
  const context = await getCurrentStaffContext();
  if (context.role !== "owner" && context.role !== "manager") return;

  const supabase = getSupabaseServerClient();
  await supabase.from("expenses").delete().eq("id", expenseId).eq("restaurant_id", context.restaurantId);

  revalidatePath("/expenses");
  revalidatePath("/reports");
}
