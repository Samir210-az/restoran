"use client";

import { useState, useTransition } from "react";
import { Percent, Wallet } from "lucide-react";
import { Button } from "@restoran/ui";
import { applyOrderDiscountAction } from "@/app/(dashboard)/orders/actions";

export function OrderDiscountForm({ orderId, onApplied }: { orderId: string; onApplied?: () => void }) {
  const [mode, setMode] = useState<"amount" | "percent">("amount");
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) return;
    startTransition(async () => {
      await applyOrderDiscountAction(orderId, { mode, value: numeric });
      setValue("");
      onApplied?.();
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex overflow-hidden rounded-md border border-border-strong">
        <button
          type="button"
          onClick={() => setMode("amount")}
          aria-label="Sabit məbləğ"
          className={`flex h-8 w-8 items-center justify-center ${mode === "amount" ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-muted"}`}
        >
          <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setMode("percent")}
          aria-label="Faiz"
          className={`flex h-8 w-8 items-center justify-center border-l border-border-strong ${mode === "percent" ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-muted"}`}
        >
          <Percent className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <input
        type="number"
        min={0}
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={mode === "percent" ? "10" : "5"}
        className="h-8 w-16 rounded-md border border-border-strong bg-bg px-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <Button size="sm" variant="outline" disabled={isPending || !value} onClick={submit}>
        Tətbiq et
      </Button>
    </div>
  );
}
