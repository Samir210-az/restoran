"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@restoran/supabase-client";
import { logger } from "@restoran/utils";

export interface MenuCategoryRow {
  id: string;
  name: Record<string, string>;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItemRow {
  id: string;
  category_id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  price: number;
  is_available: boolean;
}

/**
 * Menyu idarəetmə səhifəsinin butun data-fetch/mutasiya mentiqi bu hook-da
 * cemlesir. Sehife komponenti yalniz render ile mesguldur - bu ayrilma
 * (separation of concerns) test edilebilirliyi asanlasdirir.
 */
export function useMenuData(restaurantId: string | null) {
  const [categories, setCategories] = useState<MenuCategoryRow[]>([]);
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const [categoriesRes, itemsRes] = await Promise.all([
      supabase
        .from("menu_categories")
        .select("id, name, sort_order, is_active")
        .eq("restaurant_id", restaurantId)
        .order("sort_order"),
      supabase
        .from("menu_items")
        .select("id, category_id, name, description, price, is_available")
        .eq("restaurant_id", restaurantId)
        .order("sort_order"),
    ]);

    if (categoriesRes.error || itemsRes.error) {
      const message = categoriesRes.error?.message ?? itemsRes.error?.message ?? "Menyu yüklənə bilmədi";
      logger.error("Menyu melumati yuklenmedi", { message });
      setError(message);
      setLoading(false);
      return;
    }

    setCategories((categoriesRes.data ?? []) as MenuCategoryRow[]);
    setItems((itemsRes.data ?? []) as MenuItemRow[]);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function createCategory(nameAz: string) {
    if (!restaurantId) return;
    const supabase = createSupabaseBrowserClient();
    const { error: insertError } = await supabase.from("menu_categories").insert({
      restaurant_id: restaurantId,
      name: { az: nameAz, en: nameAz, ru: nameAz },
      sort_order: categories.length,
    });
    if (insertError) throw insertError;
    await refresh();
  }

  async function createItem(input: { categoryId: string; nameAz: string; descriptionAz: string; price: number }) {
    if (!restaurantId) return;
    const supabase = createSupabaseBrowserClient();
    const { error: insertError } = await supabase.from("menu_items").insert({
      restaurant_id: restaurantId,
      category_id: input.categoryId,
      name: { az: input.nameAz, en: input.nameAz, ru: input.nameAz },
      description: { az: input.descriptionAz, en: input.descriptionAz, ru: input.descriptionAz },
      price: input.price,
    });
    if (insertError) throw insertError;
    await refresh();
  }

  async function toggleItemAvailability(itemId: string, isAvailable: boolean) {
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from("menu_items")
      .update({ is_available: isAvailable })
      .eq("id", itemId);
    if (updateError) throw updateError;
    await refresh();
  }

  return { categories, items, isLoading, error, createCategory, createItem, toggleItemAvailability, refresh };
}
