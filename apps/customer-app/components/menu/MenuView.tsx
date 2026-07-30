"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Minus, ShoppingBag, CalendarCheck, Banknote, CreditCard } from "lucide-react";
import { Button, Modal } from "@restoran/ui";
import { cn } from "@restoran/utils";
import { placeOrder, type PaymentMethod } from "@/lib/place-order";

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
  tableId: string | null;
}

interface CartEntry {
  item: ItemRow;
  quantity: number;
}

/**
 * Musteriye gorunen menyu + sebet + checkout axini. Sebet YALNIZ
 * bu komponentin yaddasinda (React state) saxlanilir - sehife
 * yenilense sebet sifirlanir (localStorage-a kocurmek Faza 4+ ucun
 * qeyd olunub, hazirda sadelik ucun belle saxlanilmir).
 */
export function MenuView({ restaurant, categories, items, tableId }: MenuViewProps) {
  const router = useRouter();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(categories[0]?.id ?? null);
  const [cart, setCart] = useState<Record<string, CartEntry>>({});
  const [isCartOpen, setCartOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const visibleItems = activeCategoryId ? items.filter((item) => item.category_id === activeCategoryId) : items;

  const cartEntries = Object.values(cart);
  const cartCount = cartEntries.reduce((sum, entry) => sum + entry.quantity, 0);
  const cartTotal = useMemo(
    () => cartEntries.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0),
    [cartEntries]
  );

  function addToCart(item: ItemRow) {
    setCart((prev) => {
      const existing = prev[item.id];
      return { ...prev, [item.id]: { item, quantity: (existing?.quantity ?? 0) + 1 } };
    });
  }

  function changeQuantity(itemId: string, delta: number) {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const nextQty = existing.quantity + delta;
      if (nextQty <= 0) {
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: { ...existing, quantity: nextQty } };
    });
  }

  async function handleCheckout() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await placeOrder({
        restaurantId: restaurant.id,
        tableId,
        orderType: tableId ? "dine_in" : "takeaway",
        items: cartEntries.map((entry) => ({ menuItemId: entry.item.id, quantity: entry.quantity })),
        paymentMethod,
      });
      router.push(`/${restaurant.slug}/order/${result.orderId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-28 md:px-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{restaurant.name}</h1>
          <p className="text-sm text-text-secondary">{tableId ? "Masa üçün sifariş" : "Öz aparma sifarişi"}</p>
        </div>
        <Link
          href={`/${restaurant.slug}/reserve`}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-muted"
        >
          <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Masa rezerv et
        </Link>
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
          {visibleItems.map((item) => {
            const inCartQty = cart[item.id]?.quantity ?? 0;
            return (
              <div key={item.id} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">{item.name.az}</p>
                  {item.description.az && (
                    <p className="mt-1 text-sm text-text-secondary">{item.description.az}</p>
                  )}
                  <p className="mt-2 text-sm font-semibold text-accent">{item.price.toFixed(2)} ₼</p>
                </div>

                {inCartQty === 0 ? (
                  <button
                    aria-label={`${item.name.az} səbətə əlavə et`}
                    onClick={() => addToCart(item)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      aria-label="Azalt"
                      onClick={() => changeQuantity(item.id, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border-strong text-text-primary hover:bg-bg-muted"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-4 text-center text-sm font-medium text-text-primary">{inCartQty}</span>
                    <button
                      aria-label="Artır"
                      onClick={() => addToCart(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground hover:opacity-90"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-4 z-20 mx-auto flex max-w-2xl items-center justify-between rounded-lg bg-accent px-5 py-3.5 text-accent-foreground shadow-elevated animate-slide-up"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Səbət ({cartCount})
          </span>
          <span className="text-sm font-semibold">{cartTotal.toFixed(2)} ₼</span>
        </button>
      )}

      <Modal isOpen={isCartOpen} onClose={() => setCartOpen(false)} title="Səbətiniz">
        <div className="flex flex-col gap-3">
          {cartEntries.length === 0 ? (
            <p className="text-sm text-text-secondary">Səbət boşdur</p>
          ) : (
            <>
              <div className="flex max-h-64 flex-col divide-y divide-border overflow-y-auto">
                {cartEntries.map(({ item, quantity }) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">{item.name.az}</p>
                      <p className="text-xs text-text-secondary">
                        {quantity} × {item.price.toFixed(2)} ₼
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        aria-label="Azalt"
                        onClick={() => changeQuantity(item.id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-border-strong hover:bg-bg-muted"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-4 text-center text-sm">{quantity}</span>
                      <button
                        aria-label="Artır"
                        onClick={() => addToCart(item)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-semibold text-text-primary">
                <span>Cəmi</span>
                <span>{cartTotal.toFixed(2)} ₼</span>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-text-secondary">Ödəniş üsulu</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      paymentMethod === "cash"
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border text-text-secondary hover:bg-bg-muted"
                    )}
                  >
                    <Banknote className="h-4 w-4" aria-hidden="true" />
                    Nağd
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Tezliklə"
                    className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-text-muted opacity-50"
                  >
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    Kartla (tezliklə)
                  </button>
                </div>
              </div>

              {!tableId && (
                <p className="rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
                  Masa məlumatı tapılmadı — sifariş "özün apar" kimi göndəriləcək.
                </p>
              )}
              {submitError && (
                <p role="alert" className="text-sm text-danger">
                  {submitError}
                </p>
              )}

              <Button onClick={handleCheckout} isLoading={isSubmitting} className="w-full" size="lg">
                Sifarişi göndər
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
