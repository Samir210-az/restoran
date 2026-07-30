"use client";

import { useRef } from "react";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { recordTransactionAction } from "@/app/(dashboard)/inventory/actions";

const TYPE_OPTIONS = [
  { value: "purchase", label: "Alış (+)" },
  { value: "usage", label: "İstifadə (-)" },
  { value: "waste", label: "İtki (-)" },
  { value: "adjustment", label: "Düzəliş (+/-)" },
];

export function TransactionForm({ itemId }: { itemId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await recordTransactionAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="item_id" value={itemId} />
      <select
        name="type"
        defaultValue="purchase"
        className="h-8 rounded-md border border-border-strong bg-bg px-2 text-xs text-text-primary"
      >
        {TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <input
        name="quantity"
        type="number"
        step="0.01"
        placeholder="Miqdar"
        required
        className="h-8 w-24 rounded-md border border-border-strong bg-bg px-2 text-xs text-text-primary"
      />
      <SubmitButton size="sm" variant="outline">
        Qeyd et
      </SubmitButton>
    </form>
  );
}
