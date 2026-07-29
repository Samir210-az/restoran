import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createSupabasePublicClient } from "@restoran/supabase-client";
import { MenuView } from "@/components/menu/MenuView";

interface PageProps {
  params: { slug: string };
  searchParams: { table?: string };
}

/**
 * Musteri-uzlu QR Menyu sehifesi: restoran.app/[slug]?table=<uuid>
 * `table` query parametri QR koddan gelir (masa masasinin ID-si).
 * Tamamile public-dir - autentifikasiya teleb etmir, RLS-in
 * "is_active/is_available=true" siyasetlerine ve `get_public_restaurant_by_slug`
 * RPC-sine guvenir.
 */
async function getRestaurantData(slug: string) {
  const supabase = createSupabasePublicClient();

  const { data: restaurantRows } = await supabase.rpc("get_public_restaurant_by_slug", {
    _slug: slug,
  });
  const restaurant = restaurantRows?.[0];
  if (!restaurant) return null;

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, sort_order")
      .eq("restaurant_id", restaurant.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select("id, name, description, price, category_id, is_available, image_url")
      .eq("restaurant_id", restaurant.id)
      .eq("is_available", true)
      .order("sort_order", { ascending: true }),
  ]);

  return { restaurant, categories: categories ?? [], items: items ?? [] };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getRestaurantData(params.slug);
  return { title: data?.restaurant.name ?? "Menyu" };
}

export default async function RestaurantMenuPage({ params, searchParams }: PageProps) {
  const data = await getRestaurantData(params.slug);
  if (!data) notFound();

  const { restaurant, categories, items } = data;

  return (
    <MenuView
      restaurant={restaurant}
      categories={categories}
      items={items}
      tableId={searchParams.table ?? null}
    />
  );
}
