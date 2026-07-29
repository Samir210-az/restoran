"use client";

import { useState } from "react";
import { Plus, UtensilsCrossed } from "lucide-react";
import { Button, Card, CardTitle, CardDescription, Badge, Modal, Input } from "@restoran/ui";
import { useMenuData } from "@/hooks/useMenuData";

interface MenuManagerProps {
  restaurantId: string;
}

/**
 * Menyu idarəetməsinin tam UI + mentiqi. Client Component olmasinin
 * sebebi: kateqoriya/mehsul elave etme, movcudluq deyisme kimi
 * interaktivlikler aninda (optimistic olmadan da) UI-i yenilemelidir.
 */
export function MenuManager({ restaurantId }: MenuManagerProps) {
  const { categories, items, isLoading, error, createCategory, createItem, toggleItemAvailability } =
    useMenuData(restaurantId);

  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreateCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();
    try {
      await createCategory(name);
      setCategoryModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeCategoryId) return;
    setFormError(null);
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createItem({
        categoryId: activeCategoryId,
        nameAz: String(formData.get("name") ?? "").trim(),
        descriptionAz: String(formData.get("description") ?? "").trim(),
        price: Number(formData.get("price") ?? 0),
      });
      setItemModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Menyu</h1>
          <p className="text-sm text-text-secondary">Kateqoriyalar və məhsullarınızı idarə edin</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCategoryModalOpen(true)}>
          Kateqoriya əlavə et
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-text-secondary">Yüklənir...</p>
      ) : categories.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <UtensilsCrossed className="h-8 w-8 text-text-muted" aria-hidden="true" />
            <p className="text-sm text-text-secondary">Hələ kateqoriya yoxdur</p>
            <p className="text-xs text-text-muted">Menyunuzu qurmaq üçün ilk kateqoriyanı əlavə edin</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {categories.map((category) => {
            const categoryItems = items.filter((item) => item.category_id === category.id);
            return (
              <Card key={category.id}>
                <div className="mb-3 flex items-center justify-between">
                  <CardTitle>{category.name.az ?? category.name.en}</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setActiveCategoryId(category.id);
                      setItemModalOpen(true);
                    }}
                  >
                    Məhsul əlavə et
                  </Button>
                </div>

                {categoryItems.length === 0 ? (
                  <CardDescription>Bu kateqoriyada hələ məhsul yoxdur</CardDescription>
                ) : (
                  <div className="flex flex-col divide-y divide-border">
                    {categoryItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-text-primary">{item.name.az}</p>
                          <p className="text-xs text-text-secondary">{item.description.az}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-text-primary">{item.price.toFixed(2)} ₼</span>
                          <button
                            onClick={() => toggleItemAvailability(item.id, !item.is_available)}
                            className="focus-visible:outline-none"
                          >
                            <Badge variant={item.is_available ? "success" : "neutral"}>
                              {item.is_available ? "Mövcuddur" : "Bitib"}
                            </Badge>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Yeni kateqoriya"
        description="Məsələn: İsti yeməklər, Salatlar, İçkilər"
      >
        <form className="flex flex-col gap-4" onSubmit={handleCreateCategory}>
          <Input label="Kateqoriya adı" name="name" required autoFocus />
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <Button type="submit" isLoading={isSaving} className="w-full">
            Əlavə et
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title="Yeni məhsul"
      >
        <form className="flex flex-col gap-4" onSubmit={handleCreateItem}>
          <Input label="Məhsul adı" name="name" required autoFocus />
          <Input label="Təsvir" name="description" />
          <Input label="Qiymət (₼)" name="price" type="number" step="0.01" min="0" required />
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <Button type="submit" isLoading={isSaving} className="w-full">
            Əlavə et
          </Button>
        </form>
      </Modal>
    </div>
  );
}
