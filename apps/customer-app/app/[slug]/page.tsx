import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerSupabase } from "@/lib/supabase-server";
import { MenuView } from "@/components/menu/MenuView";

interface PageProps {
  params: { slug: string };
}

/**
 * QR kod bu marsruta yonlendirir: restoran.app/[slug].
 * Autentifikasiya TELEB OLUNMUR - butun sorgular public RLS
 * policy-leri (is_active/is_available=true) ile qorunur.
 */
async function getRestaurantMenu(slug: string) {
  const supabase = getServerSupabase();

  const { data: restaurantRows, error: restaurantError } = await supabase.rpc(
    "get_public_restaurant_by_slug",
    { _slug: slug }
  );

  if (restaurantError || !restaurantRows || restaurantRows.length === 0) {
    return null;
  }
  const restaurant = restaurantRows[0];

  const [categoriesRes, itemsRes] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, sort_order, is_active")
      .eq("restaurant_id", restaurant.id)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("menu_items")
      .select("id, category_id, name, description, price, is_available, image_url")
      .eq("restaurant_id", restaurant.id)
      .eq("is_available", true)
      .order("sort_order"),
  ]);

  return {
    restaurant,
    categories: categoriesRes.data ?? [],
    items: itemsRes.data ?? [],
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getRestaurantMenu(params.slug);
  return { title: data?.restaurant.name ?? "Menyu" };
}

export default async function RestaurantMenuPage({ params }: PageProps) {
  const data = await getRestaurantMenu(params.slug);
  if (!data) notFound();

  return <MenuView restaurant={data.restaurant} categories={data.categories} items={data.items} />;
}
