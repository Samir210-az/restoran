"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@restoran/ui";
import { cn } from "@restoran/utils";

interface CategoryRow {
  id: string;
  name: Record<string, string>;
  sort_order: number;
}

interface ItemRow {
  id: string;
  category_id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  price: number;
  image_url: string | null;
}

interface MenuViewProps {
  restaurant: { id: string; name: string; slug: string };
  categories: CategoryRow[];
  items: ItemRow[];
}

/**
 * Musteriye gorunen real menyu. Kateqoriya sekmeleri (tabs) + mehsul
 * kartlari. Sebet mentiqi (Faza 3-de sifaris axini ile) helelik
 * yoxdur - bu, YALNIZ menyunu gozden kecirme tecrubesidir.
 */
export function MenuView({ restaurant, categories, items }: MenuViewProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(categories[0]?.id ?? null);

  const visibleItems = activeCategoryId ? items.filter((item) => item.category_id === activeCategoryId) : items;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">{restaurant.name}</h1>
        <p className="text-sm text-text-secondary">Menyu</p>
      </div>

      {categories.length > 1 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                activeCategoryId === category.id
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border text-text-secondary hover:bg-bg-muted"
              )}
            >
              {category.name.az ?? category.name.en}
            </button>
          ))}
        </div>
      )}

      {visibleItems.length === 0 ? (
        <p className="py-12 text-center text-sm text-text-secondary">Bu kateqoriyada hələ məhsul yoxdur</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {visibleItems.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="font-medium text-text-primary">{item.name.az}</p>
                {item.description.az && (
                  <p className="mt-1 text-sm text-text-secondary">{item.description.az}</p>
                )}
                <p className="mt-2 text-sm font-semibold text-accent">{item.price.toFixed(2)} ₼</p>
              </div>
              <button
                aria-label={`${item.name.az} səbətə əlavə et`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
