"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";

/**
 * Butun bu Action-lar RLS-e guvenir: `menu_categories_write_staff` ve
 * `menu_items_write_staff` siyasetleri artiq "yalniz bu restoranin
 * aktiv iscisi yaza biler" qaydasini beze terefinde tetbiq edir. Bu
 * Action-lar elave olaraq restaurant_id-ni manual kecirir ki, sorgu
 * hansisa basqa restorana yazmaga cehd etmesin (defence in depth).
 */

export async function createCategoryAction(formData: FormData) {
  const { restaurantId } = await getCurrentStaffContext();
  const nameAz = String(formData.get("name_az") ?? "").trim();

  if (!nameAz) return;

  const supabase = getSupabaseServerClient();
  await supabase.from("menu_categories").insert({
    restaurant_id: restaurantId,
    name: { az: nameAz, en: nameAz, ru: nameAz },
  });

  revalidatePath("/menu");
}

export async function createMenuItemAction(formData: FormData) {
  const { restaurantId } = await getCurrentStaffContext();
  const categoryId = String(formData.get("category_id") ?? "");
  const nameAz = String(formData.get("name_az") ?? "").trim();
  const price = Number(formData.get("price"));

  if (!categoryId || !nameAz || Number.isNaN(price) || price < 0) return;

  const supabase = getSupabaseServerClient();
  await supabase.from("menu_items").insert({
    restaurant_id: restaurantId,
    category_id: categoryId,
    name: { az: nameAz, en: nameAz, ru: nameAz },
    description: { az: "", en: "", ru: "" },
    price,
  });

  revalidatePath("/menu");
}

export async function toggleItemAvailabilityAction(itemId: string, nextValue: boolean) {
  await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();
  await supabase.from("menu_items").update({ is_available: nextValue }).eq("id", itemId);
  revalidatePath("/menu");
}
