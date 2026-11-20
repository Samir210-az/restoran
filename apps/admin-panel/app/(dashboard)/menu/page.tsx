import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, Input, Badge, Sticker } from "@restoran/ui";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { AvailabilityToggle } from "@/components/menu/AvailabilityToggle";
import { ChefSpecialToggle } from "@/components/menu/ChefSpecialToggle";
import { CategoryHeaderActions } from "@/components/menu/CategoryHeaderActions";
import { MenuItemActions } from "@/components/menu/MenuItemActions";
import { createCategoryAction, createMenuItemAction } from "./actions";

export const metadata = { title: "Menyu" };

interface LocalizedText {
  az?: string;
  en?: string;
  ru?: string;
}

export default async function MenuPage({ searchParams }: { searchParams: { error?: string } }) {
  const { restaurantId, role } = await getCurrentStaffContext();
  const isOwner = role === "owner";
  const supabase = getSupabaseServerClient();

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, sort_order")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select("id, name, price, is_available, category_id, tags, image_url")
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

      {searchParams.error && (
        <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {searchParams.error}
        </div>
      )}

      {categoryList.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Sticker name="teapot-cupcakes" size={96} />
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
                {isOwner && (
                  <CategoryHeaderActions categoryId={category.id} currentName={categoryName} itemCount={categoryItems.length} />
                )}
              </CardHeader>

              {categoryItems.length === 0 ? (
                <p className="text-sm text-text-muted">Bu kateqoriyada hələ yemək yoxdur</p>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {categoryItems.map((item) => {
                    const itemName = (item.name as LocalizedText)?.az ?? "Adsız";
                    return (
                      <div key={item.id} className="flex items-center justify-between gap-2 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {item.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element -- kiçik önizləmə
                            <img src={item.image_url} alt="" className="h-10 w-10 shrink-0 rounded-md border border-border object-cover" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary">{itemName}</p>
                            <p className="text-sm text-text-secondary">{Number(item.price).toFixed(2)} ₼</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <AvailabilityToggle itemId={item.id} isAvailable={item.is_available} />
                          <ChefSpecialToggle itemId={item.id} tags={item.tags ?? []} />
                          {isOwner && (
                            <MenuItemActions
                              itemId={item.id}
                              currentName={itemName}
                              currentPrice={item.price}
                              hasImage={Boolean(item.image_url)}
                            />
                          )}
                        </div>
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
            <SubmitButton leftIcon={<Plus className="h-4 w-4" />} className="self-start">
              Kateqoriya əlavə et
            </SubmitButton>
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
              <label className="flex flex-col gap-1.5 text-sm text-text-secondary">
                Şəkil (istəyə bağlı)
                <input
                  type="file"
                  name="image"
                  accept="image/png,image/jpeg,image/webp"
                  className="text-xs file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent"
                />
                <span className="text-xs text-text-muted">PNG, JPEG və ya WEBP, maks 2MB. Şəkil yoxdursa, avtomatik stiker göstərilir</span>
              </label>
              <SubmitButton leftIcon={<Plus className="h-4 w-4" />} className="self-start">
                Yemək əlavə et
              </SubmitButton>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
