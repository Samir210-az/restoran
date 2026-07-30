"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";

export async function createInventoryItemAction(formData: FormData) {
  const { restaurantId } = await getCurrentStaffContext();
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const threshold = Number(formData.get("low_stock_threshold") ?? 0);
  if (!name || !unit) return;

  const supabase = getSupabaseServerClient();
  await supabase.from("inventory_items").insert({
    restaurant_id: restaurantId,
    name,
    unit,
    low_stock_threshold: Number.isFinite(threshold) ? threshold : 0,
  });

  revalidatePath("/inventory");
}

export async function recordTransactionAction(formData: FormData) {
  await getCurrentStaffContext(); // sadece staff oldugunu tesdiqleyir, RLS qalanini edir
  const itemId = String(formData.get("item_id") ?? "");
  const type = String(formData.get("type") ?? "") as "purchase" | "usage" | "waste" | "adjustment";
  const quantity = Number(formData.get("quantity") ?? 0);
  if (!itemId || !type || !Number.isFinite(quantity) || quantity === 0) return;

  const supabase = getSupabaseServerClient();
  await (
    supabase as unknown as { rpc: (fn: string, args: unknown) => Promise<{ error: unknown }> }
  ).rpc("record_inventory_transaction", { _item_id: itemId, _type: type, _quantity: quantity });

  revalidatePath("/inventory");
}

export async function createSupplierAction(formData: FormData) {
  const { restaurantId } = await getCurrentStaffContext();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name) return;

  const supabase = getSupabaseServerClient();
  await supabase.from("suppliers").insert({
    restaurant_id: restaurantId,
    name,
    contact_info: phone ? { phone } : {},
  });

  revalidatePath("/inventory");
}
