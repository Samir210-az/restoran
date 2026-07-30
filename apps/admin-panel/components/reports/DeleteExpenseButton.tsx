"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteExpenseAction } from "@/app/(dashboard)/reports/actions";

export function DeleteExpenseButton({ expenseId }: { expenseId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm("Bu xərci silmək istədiyinizə əminsiniz?")) {
          startTransition(() => deleteExpenseAction(expenseId));
        }
      }}
      aria-label="Xərci sil"
      className="shrink-0 rounded-md p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
