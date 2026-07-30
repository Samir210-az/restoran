"use client";

import { useRef, useState } from "react";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { recordTransactionAction, recordPurchaseAction } from "@/app/(dashboard)/inventory/actions";

const NON_MONEY_TYPES = [
  { value: "usage", label: "İstifadə (-)" },
  { value: "waste", label: "İtki (-)" },
  { value: "adjustment", label: "Düzəliş (+/-)" },
];

interface SupplierOption {
  id: string;
  name: string;
}

/**
 * "Alış (+)" digerlerinden ferqli davranir: bu, PUL xerci ile
 * bagli oldugu ucun (techizatciya odenilir) ozunun ayrica formu
 * var - miqdar+mebleg+techizatci. Submit olanda `record_supplier_purchase`
 * RPC-sine gedir ki, HEM stok artsin, HEM `expenses` cedveline yazilsin.
 * Diger novler (istifade/itki/duzelis) pulla bagli olmadigi ucun
 * kohne sade axinla (`recordTransactionAction`) qalir.
 */
export function TransactionForm({ itemId, suppliers }: { itemId: string; suppliers: SupplierOption[] }) {
  const [mode, setMode] = useState<"purchase" | "other">("purchase");
  const formRef = useRef<HTMLFormElement>(null);

  if (mode === "purchase") {
    return (
      <form
        ref={formRef}
        action={async (formData) => {
          await recordPurchaseAction(formData);
          formRef.current?.reset();
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <input type="hidden" name="item_id" value={itemId} />
        <label className="flex flex-col gap-0.5 text-[11px] text-text-muted">
          Miqdar
          <input name="quantity" type="number" step="0.01" min="0.01" required placeholder="0" className="h-8 w-20 rounded-md border border-border-strong bg-bg px-2 text-xs text-text-primary" />
        </label>
        <label className="flex flex-col gap-0.5 text-[11px] text-text-muted">
          Məbləğ (₼)
          <input name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" className="h-8 w-24 rounded-md border border-border-strong bg-bg px-2 text-xs text-text-primary" />
        </label>
        <label className="flex flex-col gap-0.5 text-[11px] text-text-muted">
          Təchizatçı
          <select name="supplier_id" defaultValue="" className="h-8 rounded-md border border-border-strong bg-bg px-2 text-xs text-text-primary">
            <option value="">— Yoxdur —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <SubmitButton size="sm" variant="outline">
          Alışı qeyd et
        </SubmitButton>
        <button
          type="button"
          onClick={() => setMode("other")}
          className="text-[11px] text-text-muted underline hover:text-text-secondary"
        >
          başqa əməliyyat
        </button>
      </form>
    );
  }

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
      <select name="type" defaultValue="usage" className="h-8 rounded-md border border-border-strong bg-bg px-2 text-xs text-text-primary">
        {NON_MONEY_TYPES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <input name="quantity" type="number" step="0.01" placeholder="Miqdar" required className="h-8 w-24 rounded-md border border-border-strong bg-bg px-2 text-xs text-text-primary" />
      <SubmitButton size="sm" variant="outline">
        Qeyd et
      </SubmitButton>
      <button
        type="button"
        onClick={() => setMode("purchase")}
        className="text-[11px] text-text-muted underline hover:text-text-secondary"
      >
        təchizatçıdan alış
      </button>
    </form>
  );
}
