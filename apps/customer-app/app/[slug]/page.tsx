import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Card, Badge } from "@restoran/ui";
import { createSupabasePublicClient } from "@restoran/supabase-client";

interface LocalizedText {
  az?: string;
  en?: string;
  ru?: string;
}

interface PageProps {
  params: { slug: string };
}

/**
 * Musteri-uzlu QR Menyu sehifesi: restoran.app/[slug]
 * Tamamile public-dir - autentifikasiya teleb etmir, RLS-in
 * "is_active/is_available=true" siyasetlerine guvenir.
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

export default async function RestaurantMenuPage({ params }: PageProps) {
  const data = await getRestaurantData(params.slug);
  if (!data) notFound();

  const { restaurant, categories, items } = data;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">{restaurant.name}</h1>
        <button className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          AI Ofisiantla söhbət et
        </button>
      </div>

      {categories.length === 0 ? (
        <p className="text-center text-sm text-text-secondary">Bu restoranın menyusu tezliklə əlavə olunacaq</p>
      ) : (
        <div className="flex flex-col gap-8">
          {categories.map((category) => {
            const categoryName = (category.name as LocalizedText)?.az ?? "";
            const categoryItems = items.filter((item) => item.category_id === category.id);
            if (categoryItems.length === 0) return null;

            return (
              <section key={category.id}>
                <h2 className="mb-3 text-lg font-semibold text-text-primary">{categoryName}</h2>
                <div className="flex flex-col gap-3">
                  {categoryItems.map((item) => {
                    const itemName = (item.name as LocalizedText)?.az ?? "";
                    const itemDescription = (item.description as LocalizedText)?.az ?? "";
                    return (
                      <Card key={item.id} className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary">{itemName}</p>
                          {itemDescription && (
                            <p className="mt-0.5 truncate text-sm text-text-secondary">{itemDescription}</p>
                          )}
                        </div>
                        <Badge variant="accent" className="shrink-0 text-sm">
                          {Number(item.price).toFixed(2)} ₼
                        </Badge>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
