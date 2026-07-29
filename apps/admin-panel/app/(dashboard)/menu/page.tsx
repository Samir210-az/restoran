import { Plus, UtensilsCrossed } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, Button, Input, Badge } from "@restoran/ui";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { AvailabilityToggle } from "@/components/menu/AvailabilityToggle";
import { createCategoryAction, createMenuItemAction } from "./actions";

export const metadata = { title: "Menyu" };

interface LocalizedText {
  az?: string;
  en?: string;
  ru?: string;
}

export default async function MenuPage() {
  const { restaurantId } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, sort_order")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select("id, name, price, is_available, category_id")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true }),
  ]);

  const categoryList = categories ?? [];
  const itemList = items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-text-primary">Menyu</h1>
        <p className="text-sm text-text-secondary">
          Kateqoriyalar və yeməklər — dəyişikliklər dərhal QR menyuda görünəcək
        </p>
      </div>

      {categoryList.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <UtensilsCrossed className="h-8 w-8 text-text-muted" aria-hidden="true" />
            <p className="text-sm font-medium text-text-primary">Hələ kateqoriya yoxdur</p>
            <p className="text-xs text-text-muted">Aşağıdakı formadan ilk kateqoriyanı əlavə edin</p>
          </div>
        </Card>
      ) : (
        categoryList.map((category) => {
          const categoryName = (category.name as LocalizedText)?.az ?? "Adsız kateqoriya";
          const categoryItems = itemList.filter((item) => item.category_id === category.id);

          return (
            <Card key={category.id}>
              <CardHeader>
                <div>
                  <CardTitle>{categoryName}</CardTitle>
                  <CardDescription>{categoryItems.length} yemək</CardDescription>
                </div>
              </CardHeader>

              {categoryItems.length === 0 ? (
                <p className="text-sm text-text-muted">Bu kateqoriyada hələ yemək yoxdur</p>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {categoryItems.map((item) => {
                    const itemName = (item.name as LocalizedText)?.az ?? "Adsız";
                    return (
                      <div key={item.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-text-primary">{itemName}</p>
                          <p className="text-sm text-text-secondary">{Number(item.price).toFixed(2)} ₼</p>
                        </div>
                        <AvailabilityToggle itemId={item.id} isAvailable={item.is_available} />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Yeni kateqoriya</CardTitle>
          </CardHeader>
          <form action={createCategoryAction} className="flex flex-col gap-3">
            <Input name="name_az" placeholder="Məs. Əsas yeməklər" required />
            <Button type="submit" leftIcon={<Plus className="h-4 w-4" />} className="self-start">
              Kateqoriya əlavə et
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yeni yemək</CardTitle>
          </CardHeader>
          {categoryList.length === 0 ? (
            <p className="text-sm text-text-muted">Əvvəlcə bir kateqoriya yaradın</p>
          ) : (
            <form action={createMenuItemAction} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-text-primary">Kateqoriya</span>
                <select
                  name="category_id"
                  required
                  className="h-10 rounded-md border border-border-strong bg-bg px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {categoryList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {(c.name as LocalizedText)?.az ?? "Adsız"}
                    </option>
                  ))}
                </select>
              </label>
              <Input name="name_az" placeholder="Məs. Toyuq Şaşlıq" required />
              <Input name="price" type="number" step="0.01" min="0" placeholder="Qiymət (₼)" required />
              <Button type="submit" leftIcon={<Plus className="h-4 w-4" />} className="self-start">
                Yemək əlavə et
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
