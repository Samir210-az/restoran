"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, Input, Button } from "@restoran/ui";
import { createSupabaseBrowserClient } from "@restoran/supabase-client";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
}

/**
 * Kateqoriya adı 3 dilde (az/en/ru) saxlanilir (menu_categories.name jsonb).
 * AZ meburidir; EN/RU bos qalarsa AZ deyeri kopyalanir (redaktoru
 * ilkin merhelede sadelesdirmek ucun - sonra ayrica tercume edile biler).
 */
export function CategoryFormModal({ isOpen, onClose, restaurantId }: CategoryFormModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const az = String(formData.get("name_az") ?? "").trim();
    const en = String(formData.get("name_en") ?? "").trim() || az;
    const ru = String(formData.get("name_ru") ?? "").trim() || az;

    if (!az) {
      setError("Azərbaycanca ad məcburidir");
      setIsSaving(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: insertError } = await supabase.from("menu_categories").insert({
      restaurant_id: restaurantId,
      name: { az, en, ru },
    });

    if (insertError) {
      setError("Kateqoriya yaradılarkən xəta baş verdi");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    onClose();
    router.refresh();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni kateqoriya" description="Menyu bölməsi əlavə edin">
      {error && (
        <div role="alert" className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input label="Ad (Azərbaycanca)" name="name_az" placeholder="Məs. Əsas yeməklər" required autoFocus />
        <Input label="Ad (İngiliscə)" name="name_en" placeholder="Boş qalsa AZ istifadə olunur" />
        <Input label="Ad (Rusca)" name="name_ru" placeholder="Boş qalsa AZ istifadə olunur" />
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
