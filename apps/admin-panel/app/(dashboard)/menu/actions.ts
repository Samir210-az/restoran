"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { uploadMenuItemImage, removeMenuItemImage } from "@/lib/menu-item-image";

/**
 * Butun bu Action-lar RLS-e guvenir: `menu_categories_write_staff` ve
 * `menu_items_write_staff` siyasetleri artiq "yalniz bu restoranin
 * aktiv iscisi yaza biler" qaydasini beze terefinde tetbiq edir. Bu
 * Action-lar elave olaraq restaurant_id-ni manual kecirir ki, sorgu
 * hansisa basqa restorana yazmaga cehd etmesin (defence in depth).
 */

function parseStation(value: FormDataEntryValue | null): "kitchen" | "bar" {
  return value === "bar" ? "bar" : "kitchen";
}

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

  const image = await uploadMenuItemImage(restaurantId, formData.get("image"));
  if (image && "error" in image) redirect("/menu?error=" + encodeURIComponent(image.error));

  const supabase = getSupabaseServerClient();
  await supabase.from("menu_items").insert({
    restaurant_id: restaurantId,
    category_id: categoryId,
    name: { az: nameAz, en: nameAz, ru: nameAz },
    description: { az: "", en: "", ru: "" },
    price,
    prep_station: parseStation(formData.get("prep_station")),
    ...(image ? { image_url: image.url } : {}),
  });

  revalidatePath("/menu");
}

export async function toggleItemAvailabilityAction(itemId: string, nextValue: boolean) {
  await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();
  await supabase.from("menu_items").update({ is_available: nextValue }).eq("id", itemId);
  revalidatePath("/menu");
}

export async function toggleChefSpecialAction(itemId: string, currentTags: string[]) {
  await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();
  const hasTag = currentTags.includes("chef_special");
  const nextTags = hasTag ? currentTags.filter((t) => t !== "chef_special") : [...currentTags, "chef_special"];
  await supabase.from("menu_items").update({ tags: nextTags }).eq("id", itemId);
  revalidatePath("/menu");
}

/**
 * Redakte ve silme YALNIZ owner-e aciqdir (menecer/kassir/asci/ofisiant
 * yox) - bu, RLS-in "manager de yaza biler" qaydasindan qesden daha
 * mehdud, ona gore hem burda, hem UI-da (page.tsx-de isOwner) yoxlanilir.
 */
async function requireOwner() {
  const context = await getCurrentStaffContext();
  if (context.role !== "owner") {
    throw new Error("FORBIDDEN: yalnız restoran sahibi redaktə/silmə edə bilər");
  }
  return context;
}

export async function updateCategoryAction(formData: FormData) {
  const { restaurantId } = await requireOwner();
  const categoryId = String(formData.get("category_id") ?? "");
  const nameAz = String(formData.get("name_az") ?? "").trim();
  if (!categoryId || !nameAz) return;

  const supabase = getSupabaseServerClient();
  await supabase
    .from("menu_categories")
    .update({ name: { az: nameAz, en: nameAz, ru: nameAz } })
    .eq("id", categoryId)
    .eq("restaurant_id", restaurantId);

  revalidatePath("/menu");
}

export async function deleteCategoryAction(categoryId: string) {
  const { restaurantId } = await requireOwner();
  const supabase = getSupabaseServerClient();
  // menu_items.category_id -> menu_categories.id ON DELETE CASCADE oldugu ucun
  // kateqoriyani silmek onun butun yemeklerini de silir - buna gore UI-da
  // xeberdarliq (window.confirm) telep olunur.
  await supabase.from("menu_categories").delete().eq("id", categoryId).eq("restaurant_id", restaurantId);
  revalidatePath("/menu");
}

export async function updateMenuItemAction(formData: FormData) {
  const { restaurantId } = await requireOwner();
  const itemId = String(formData.get("item_id") ?? "");
  const nameAz = String(formData.get("name_az") ?? "").trim();
  const price = Number(formData.get("price"));
  if (!itemId || !nameAz || Number.isNaN(price) || price < 0) return;

  const supabase = getSupabaseServerClient();
  const { data: current } = await supabase
    .from("menu_items")
    .select("image_url")
    .eq("id", itemId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  const image = await uploadMenuItemImage(restaurantId, formData.get("image"));
  if (image && "error" in image) redirect("/menu?error=" + encodeURIComponent(image.error));

  const updates: {
    name: { az: string; en: string; ru: string };
    price: number;
    prep_station: "kitchen" | "bar";
    image_url?: string | null;
  } = {
    name: { az: nameAz, en: nameAz, ru: nameAz },
    price,
    prep_station: parseStation(formData.get("prep_station")),
  };
  if (image) updates.image_url = image.url;
  else if (formData.get("remove_image") === "on") updates.image_url = null;

  await supabase.from("menu_items").update(updates).eq("id", itemId).eq("restaurant_id", restaurantId);

  if ("image_url" in updates) await removeMenuItemImage(restaurantId, current?.image_url);

  revalidatePath("/menu");
}

export async function deleteMenuItemAction(itemId: string) {
  const { restaurantId } = await requireOwner();
  const supabase = getSupabaseServerClient();
  const { data: current } = await supabase
    .from("menu_items")
    .select("image_url")
    .eq("id", itemId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  await supabase.from("menu_items").delete().eq("id", itemId).eq("restaurant_id", restaurantId);
  await removeMenuItemImage(restaurantId, current?.image_url);
  revalidatePath("/menu");
}
