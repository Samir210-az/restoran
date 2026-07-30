"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Minus, ShoppingBag, CalendarCheck, Banknote, CreditCard, Flame, ChefHat } from "lucide-react";
import { Button, Modal, Input } from "@restoran/ui";
import { cn } from "@restoran/utils";
import { placeOrder, type PaymentMethod } from "@/lib/place-order";
import { AIWaiterChat } from "./AIWaiterChat";

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
  tags: string[];
}

interface TableRow {
  id: string;
  table_number: string;
}

interface MenuViewProps {
  restaurant: { id: string; name: string; slug: string; logo_url?: string | null };
  categories: CategoryRow[];
  items: ItemRow[];
  tableId: string | null;
  bestsellerItemId: string | null;
  tables: TableRow[];
}

interface CartEntry {
  item: ItemRow;
  quantity: number;
}

type FulfilmentMode = "dine_in" | "takeaway" | "delivery";

/**
 * Musteriye gorunen menyu + sebet + checkout axini. Sebet YALNIZ
 * bu komponentin yaddasinda (React state) saxlanilir - sehife
 * yenilense sebet sifirlanir (localStorage-a kocurmek Faza 4+ ucun
 * qeyd olunub, hazirda sadelik ucun belle saxlanilmir).
 *
 * Masa secimi: eger QR koddan `tableId` gelibse (URL-de ?table=...),
 * bu SABIT qebul edilir - musteri onu deyise bilmez (fiziki QR
 * masaya bagli oldugu ucun). QR-siz gelen musteri (birbasa link/
 * direktoridan) ise "Masadayam / Ozumle aparıram / Evə çatdırılma"
 * secimini OZU edir.
 */
export function MenuView({ restaurant, categories, items, tableId, bestsellerItemId, tables }: MenuViewProps) {
  const router = useRouter();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(categories[0]?.id ?? null);
  const [cart, setCart] = useState<Record<string, CartEntry>>({});
  const [isCartOpen, setCartOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [phone, setPhone] = useState("");
  const [fulfilmentMode, setFulfilmentMode] = useState<FulfilmentMode>("takeaway");
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

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

    // QR-dan gelen tableId varsa - HEMISE dine_in, masa sabitdir.
    // Yoxdursa - musterinin sectiyi rejime gore teyin olunur.
    const effectiveOrderType = tableId ? "dine_in" : fulfilmentMode;
    const effectiveTableId = tableId || (fulfilmentMode === "dine_in" ? selectedTableId : null);

    if (!tableId && fulfilmentMode === "dine_in" && !selectedTableId) {
      setSubmitError("Zəhmət olmasa oturduğunuz masanı seçin");
      return;
    }
    if (effectiveOrderType === "delivery") {
      if (!phone.trim()) {
        setSubmitError("Evə çatdırılma üçün telefon nömrəsi tələb olunur");
        return;
      }
      if (!deliveryAddress.trim()) {
        setSubmitError("Evə çatdırılma üçün ünvanınızı yazın");
        return;
      }
    }

    setSubmitting(true);
    try {
      const result = await placeOrder({
        restaurantId: restaurant.id,
        tableId: effectiveTableId || null,
        orderType: effectiveOrderType,
        items: cartEntries.map((entry) => ({ menuItemId: entry.item.id, quantity: entry.quantity })),
        paymentMethod,
        customerPhone: phone.trim() || undefined,
        deliveryAddress: effectiveOrderType === "delivery" ? deliveryAddress.trim() : undefined,
      });
      router.push(`/${restaurant.slug}/order/${result.orderId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setSubmitting(false);
    }
  }

  const bestsellerItem = bestsellerItemId ? items.find((i) => i.id === bestsellerItemId) : null;
  const chefSpecials = items.filter((i) => i.tags?.includes("chef_special"));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-28 md:px-6">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {restaurant.logo_url && (
            /* eslint-disable-next-line @next/next/no-img-element -- kicik dairevi loqo, next/image-a ehtiyac yoxdur */
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="h-11 w-11 shrink-0 rounded-full border border-border object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">{restaurant.name} sizi salamlayır! 👋</h1>
            <p className="text-sm text-text-secondary">
              {tableId ? "Masanız üçün ləzzətli seçimlər hazırdır" : "Öz aparma sifarişiniz üçün buyurun"}
            </p>
          </div>
        </div>
        <Link
          href={`/${restaurant.slug}/reserve`}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-muted"
        >
          <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Masa rezerv et
        </Link>
      </div>

      {(bestsellerItem || chefSpecials.length > 0) && (
        <div className="mb-6 mt-4 flex flex-col gap-2">
          {bestsellerItem && (
            <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-sm">
              <Flame className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span className="text-text-primary">
                <span className="font-medium">Bu gün ən çox sevilən:</span> {bestsellerItem.name.az}
              </span>
            </div>
          )}
          {chefSpecials.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border bg-bg-muted px-3 py-2 text-sm">
              <ChefHat className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
              <span className="text-text-primary">
                <span className="font-medium">Aşpazın təklifi:</span> {item.name.az}
              </span>
            </div>
          ))}
        </div>
      )}

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

              {!tableId && (
                <div>
                  <p className="mb-2 text-xs font-medium text-text-secondary">Sifariş necə olsun?</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFulfilmentMode("dine_in")}
                      className={cn(
                        "rounded-md border px-2 py-2 text-xs font-medium transition-colors",
                        fulfilmentMode === "dine_in"
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-border text-text-secondary hover:bg-bg-muted"
                      )}
                    >
                      Masadayam
                    </button>
                    <button
                      type="button"
                      onClick={() => setFulfilmentMode("takeaway")}
                      className={cn(
                        "rounded-md border px-2 py-2 text-xs font-medium transition-colors",
                        fulfilmentMode === "takeaway"
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-border text-text-secondary hover:bg-bg-muted"
                      )}
                    >
                      Özüm aparıram
                    </button>
                    <button
                      type="button"
                      onClick={() => setFulfilmentMode("delivery")}
                      className={cn(
                        "rounded-md border px-2 py-2 text-xs font-medium transition-colors",
                        fulfilmentMode === "delivery"
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-border text-text-secondary hover:bg-bg-muted"
                      )}
                    >
                      Evə çatdır
                    </button>
                  </div>

                  {fulfilmentMode === "dine_in" && (
                    <div className="mt-3">
                      {tables.length === 0 ? (
                        <p className="text-xs text-warning">Bu restoranda hələ masa qeydə alınmayıb</p>
                      ) : (
                        <label className="flex flex-col gap-1.5 text-sm">
                          <span className="text-xs font-medium text-text-secondary">Masanızı seçin</span>
                          <select
                            value={selectedTableId}
                            onChange={(e) => setSelectedTableId(e.target.value)}
                            className="rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-text-primary"
                          >
                            <option value="">— Seçin —</option>
                            {tables.map((t) => (
                              <option key={t.id} value={t.id}>
                                Masa {t.table_number}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                  )}

                  {fulfilmentMode === "delivery" && (
                    <label className="mt-3 flex flex-col gap-1.5 text-sm">
                      <span className="text-xs font-medium text-text-secondary">Ünvanınız *</span>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        rows={2}
                        placeholder="Küçə, ev, mənzil nömrəsi..."
                        className="rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
                      />
                    </label>
                  )}
                </div>
              )}

              <div>
                <Input
                  label={fulfilmentMode === "delivery" && !tableId ? "Telefon *" : "Telefon (loyallıq balı üçün, istəyə bağlı)"}
                  type="tel"
                  placeholder="050 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="mt-1 text-xs text-text-muted">Hər 1 ₼ xərcə 1 bal — sonrakı sifarişlərdə tanınacaqsınız</p>
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
                    onClick={() => setPaymentMethod("card")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      paymentMethod === "card"
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border text-text-secondary hover:bg-bg-muted"
                    )}
                  >
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    Kartla
                  </button>
                </div>
              </div>

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

      <AIWaiterChat restaurantId={restaurant.id} items={items} onAddToCart={addToCart} />
    </div>
  );
}
