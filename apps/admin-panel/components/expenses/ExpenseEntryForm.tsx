"use client";

import { useState } from "react";
import { Input, Button } from "@restoran/ui";
import { addExpenseAction } from "@/app/(dashboard)/expenses/actions";

const CATEGORY_LABELS: Record<string, string> = {
  supplier_payment: "Təchizatçıya ödəniş",
  rent: "Kira",
  utility: "Kommunal ödəniş",
  tax: "Vergi ödənişi",
  other: "Digər xərc",
};

interface SupplierOption {
  id: string;
  name: string;
}

export function ExpenseEntryForm({ suppliers }: { suppliers: SupplierOption[] }) {
  const [category, setCategory] = useState("supplier_payment");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={addExpenseAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-text-primary">Xərc növü</span>
        <select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-text-primary"
        >
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {category === "supplier_payment" && (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-text-primary">Təchizatçı (istəyə bağlı)</span>
          <select name="supplier_id" defaultValue="" className="rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-text-primary">
            <option value="">— Seçilməyib —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input label="Məbləğ (₼)" name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" />
        <Input label="Tarix" name="expense_date" type="date" defaultValue={today} required />
      </div>

      <Input label="Qeyd (istəyə bağlı)" name="description" placeholder="Məsələn: iyul ayı elektrik haqqı" />

      <Button type="submit" className="self-start">
        Xərci əlavə et
      </Button>
    </form>
  );
}
