export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { createSupabasePublicClient } from "@restoran/supabase-client";
import { hexToRgbTriplet, lightenRgbTriplet, contrastForegroundRgbTriplet } from "@restoran/utils";
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

  const [{ data: categories }, { data: items }, { data: bestsellerRows }, { data: tables }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, sort_order")
      .eq("restaurant_id", restaurant.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select("id, name, description, price, category_id, is_available, image_url, tags")
      .eq("restaurant_id", restaurant.id)
      .eq("is_available", true)
      .order("sort_order", { ascending: true }),
    supabase.rpc("get_todays_bestseller", { _restaurant_id: restaurant.id }),
    supabase.rpc("get_public_restaurant_tables", { _restaurant_id: restaurant.id }),
  ]);

  return {
    restaurant,
    categories: categories ?? [],
    items: items ?? [],
    bestsellerItemId: bestsellerRows?.[0]?.menu_item_id ?? null,
    tables: tables ?? [],
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getRestaurantData(params.slug);
  return { title: data?.restaurant.name ?? "Menyu" };
}

export default async function RestaurantMenuPage({ params, searchParams }: PageProps) {
  const data = await getRestaurantData(params.slug);
  if (!data) notFound();

  const { restaurant, categories, items, bestsellerItemId, tables } = data;

  // Her restoranin OZ tonlari: --accent/--accent-soft/--accent-foreground
  // bu wrapper-de theme_color-a esasen EVEZ olunur (root tokens.css-i
  // deyismir, yalnix bu alt-agacda override edir) + accent-den tureyen
  // yumsaq fon (SAD-in "her sehife her restoran ucun ferqli tonlar ve fon" telebi).
  const themeStyle = {
    ["--accent" as string]: hexToRgbTriplet(restaurant.theme_color),
    ["--accent-soft" as string]: lightenRgbTriplet(restaurant.theme_color),
    ["--accent-foreground" as string]: contrastForegroundRgbTriplet(restaurant.theme_color),
  } as React.CSSProperties;

  return (
    <div style={themeStyle} className="relative min-h-screen">
      {/* Ana sehife ile EYNI qaydada: tam-sehife foto fonu + tund overlay.
          Ferq: burada restoranın OZ theme_color-u ile rengli radial
          gradient elave olunur (SAD-in "her restoran ucun ferqli ton"
          telebi ile bu sehifenin "tam fon" telebi birlesir). */}
      <div className="fixed inset-0 -z-20" aria-hidden="true">
        <Image src="/images/hero-restaurant.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-black/70" />
        <div
          className="absolute inset-0 opacity-50"
          style={{ background: `radial-gradient(circle at 50% 0%, rgb(var(--accent) / 0.3), transparent 55%)` }}
        />
      </div>

      <MenuView
        restaurant={restaurant}
        categories={categories as unknown as { id: string; name: Record<string, string>; sort_order: number }[]}
        items={
          items as unknown as {
            id: string;
            category_id: string;
            name: Record<string, string>;
            description: Record<string, string>;
            price: number;
            image_url: string | null;
            tags: string[];
          }[]
        }
        tableId={searchParams.table ?? null}
        bestsellerItemId={bestsellerItemId}
        tables={tables as unknown as { id: string; table_number: string }[]}
      />
    </div>
  );
}
