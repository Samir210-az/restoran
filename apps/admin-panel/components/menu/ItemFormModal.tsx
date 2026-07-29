"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, Input, Textarea, Button } from "@restoran/ui";
import { createSupabaseBrowserClient } from "@restoran/supabase-client";
import type { Database } from "@restoran/supabase-client";

type MenuCategory = Database["public"]["Tables"]["menu_categories"]["Row"];

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  categories: MenuCategory[];
}

export function ItemFormModal({ isOpen, onClose, restaurantId, categories }: ItemFormModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const categoryId = String(formData.get("category_id") ?? "");
    const nameAz = String(formData.get("name_az") ?? "").trim();
    const nameEn = String(formData.get("name_en") ?? "").trim() || nameAz;
    const nameRu = String(formData.get("name_ru") ?? "").trim() || nameAz;
    const descriptionAz = String(formData.get("description_az") ?? "").trim();
    const priceRaw = String(formData.get("price") ?? "");
    const price = Number(priceRaw);

    if (!categoryId) {
      setError("Kateqoriya seçin");
      setIsSaving(false);
      return;
    }
    if (!nameAz) {
      setError("Azərbaycanca ad məcburidir");
      setIsSaving(false);
      return;
    }
    if (!priceRaw || Number.isNaN(price) || price < 0) {
      setError("Düzgün qiymət daxil edin");
      setIsSaving(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: insertError } = await supabase.from("menu_items").insert({
      restaurant_id: restaurantId,
      category_id: categoryId,
      name: { az: nameAz, en: nameEn, ru: nameRu },
      description: { az: descriptionAz, en: descriptionAz, ru: descriptionAz },
      price,
    });

    if (insertError) {
      setError("Yemək əlavə edilərkən xəta baş verdi");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    onClose();
    router.refresh();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni menyu maddəsi" description="Kateqoriyaya yemək əlavə edin">
      {error && (
        <div role="alert" className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category_id" className="text-sm font-medium text-text-primary">
            Kateqoriya
          </label>
          <select
            id="category_id"
            name="category_id"
            required
            defaultValue=""
            className="h-10 w-full rounded-md border border-border-strong bg-bg px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-bg"
          >
            <option value="" disabled>
              Seçin
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name.az ?? Object.values(category.name)[0]}
              </option>
            ))}
          </select>
        </div>

        <Input label="Ad (Azərbaycanca)" name="name_az" placeholder="Məs. Toyuq şaşlıq" required autoFocus />
        <Input label="Ad (İngiliscə)" name="name_en" placeholder="Boş qalsa AZ istifadə olunur" />
        <Input label="Ad (Rusca)" name="name_ru" placeholder="Boş qalsa AZ istifadə olunur" />
        <Textarea label="Təsvir" name="description_az" placeholder="Qısa təsvir (istəyə bağlı)" rows={2} />
        <Input label="Qiymət (AZN)" name="price" type="number" step="0.01" min="0" placeholder="0.00" required />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Ləğv et
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Yadda saxla
          </Button>
        </div>
      </form>
    </Modal>
  );
}
