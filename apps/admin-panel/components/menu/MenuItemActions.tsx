"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { MenuImagePicker } from "@/components/menu/MenuImagePicker";
import { updateMenuItemAction, deleteMenuItemAction } from "@/app/(dashboard)/menu/actions";

export function MenuItemActions({
  itemId,
  currentName,
  currentPrice,
  hasImage,
  currentStation,
}: {
  itemId: string;
  currentName: string;
  currentPrice: number;
  hasImage: boolean;
  currentStation: "kitchen" | "bar";
}) {
  const [isEditing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (isEditing) {
    return (
      <form
        action={(formData) => {
          startTransition(async () => {
            await updateMenuItemAction(formData);
            setEditing(false);
            router.refresh();
          });
        }}
        className="flex w-full min-w-0 flex-wrap items-center gap-2"
      >
        <input type="hidden" name="item_id" value={itemId} />
        <input
          name="name_az"
          defaultValue={currentName}
          autoFocus
          className="h-8 min-w-0 flex-1 rounded-md border border-border-strong bg-bg px-2 text-sm text-text-primary"
        />
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={currentPrice}
          className="h-8 w-20 rounded-md border border-border-strong bg-bg px-2 text-sm text-text-primary"
        />
        <select
          name="prep_station"
          defaultValue={currentStation}
          aria-label="Hazırlanma yeri"
          className="h-8 rounded-md border border-border-strong bg-bg px-2 text-sm text-text-primary"
        >
          <option value="kitchen">Mətbəx</option>
          <option value="bar">Bar</option>
        </select>
        <button type="submit" disabled={isPending} aria-label="Yadda saxla" className="text-success hover:opacity-80">
          <Check className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setEditing(false)} aria-label="İmtina et" className="text-text-muted hover:opacity-80">
          <X className="h-4 w-4" />
        </button>
        <MenuImagePicker currentUrl={hasImage ? "yes" : null} />
        {hasImage && (
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input type="checkbox" name="remove_image" />
            Şəkli sil
          </label>
        )}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setEditing(true)}
        aria-label="Yeməyi redaktə et"
        className="rounded-md p-1.5 text-text-muted hover:bg-bg-muted hover:text-text-primary"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        disabled={isPending}
        onClick={() => {
          if (window.confirm(`"${currentName}" silinsin?`)) {
            startTransition(async () => {
              await deleteMenuItemAction(itemId);
              router.refresh();
            });
          }
        }}
        aria-label="Yeməyi sil"
        className="rounded-md p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
