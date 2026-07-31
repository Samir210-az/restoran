"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { updateCategoryAction, deleteCategoryAction } from "@/app/(dashboard)/menu/actions";

export function CategoryHeaderActions({
  categoryId,
  currentName,
  itemCount,
}: {
  categoryId: string;
  currentName: string;
  itemCount: number;
}) {
  const [isEditing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (isEditing) {
    return (
      <form
        action={(formData) => {
          startTransition(async () => {
            await updateCategoryAction(formData);
            setEditing(false);
            router.refresh();
          });
        }}
        className="flex items-center gap-2"
      >
        <input type="hidden" name="category_id" value={categoryId} />
        <input
          name="name_az"
          defaultValue={currentName}
          autoFocus
          className="h-8 rounded-md border border-border-strong bg-bg px-2 text-sm text-text-primary"
        />
        <button type="submit" disabled={isPending} aria-label="Yadda saxla" className="text-success hover:opacity-80">
          <Check className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setEditing(false)} aria-label="İmtina et" className="text-text-muted hover:opacity-80">
          <X className="h-4 w-4" />
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setEditing(true)}
        aria-label="Kateqoriyanı redaktə et"
        className="rounded-md p-1.5 text-text-muted hover:bg-bg-muted hover:text-text-primary"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        disabled={isPending}
        onClick={() => {
          const message =
            itemCount > 0
              ? `Bu kateqoriyada ${itemCount} yemək var. Sildikdə onlar da silinəcək. Əminsiniz?`
              : "Bu kateqoriyanı silmək istədiyinizə əminsiniz?";
          if (window.confirm(message)) {
            startTransition(async () => {
              await deleteCategoryAction(categoryId);
              router.refresh();
            });
          }
        }}
        aria-label="Kateqoriyanı sil"
        className="rounded-md p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
