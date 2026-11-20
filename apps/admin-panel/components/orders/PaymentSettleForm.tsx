"use client";

import { useState, useTransition } from "react";
import { Button, Input } from "@restoran/ui";
import { settlePaymentAction } from "@/app/(dashboard)/orders/actions";

interface Waiter {
  id: string;
  full_name: string | null;
}

export function PaymentSettleForm({
  orderId,
  due,
  defaultWaiterId,
  waiters,
  cashOnly,
  onDone,
}: {
  orderId: string;
  due: number;
  defaultWaiterId: string | null;
  waiters: Waiter[];
  cashOnly: boolean;
  onDone: () => void;
}) {
  const [cash, setCash] = useState(cashOnly ? due.toFixed(2) : "");
  const [tendered, setTendered] = useState("");
  const [tip, setTip] = useState("");
  const [tipMethod, setTipMethod] = useState<"cash" | "card">("cash");
  const [waiterId, setWaiterId] = useState(defaultWaiterId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const cashValue = Number(cash.replace(",", ".")) || 0;
  const card = Math.max(0, Math.round((due - cashValue) * 100) / 100);
  const tipValue = Number(tip.replace(",", ".")) || 0;
  const tenderedValue = Number(tendered.replace(",", ".")) || 0;
  const cashNeeded = Math.round((cashValue + (tipMethod === "cash" ? tipValue : 0)) * 100) / 100;
  const change = tenderedValue > 0 ? Math.round((tenderedValue - cashNeeded) * 100) / 100 : 0;
  const invalid =
    cashValue < 0 ||
    cashValue > due ||
    tipValue < 0 ||
    (tipValue > 0 && !waiterId) ||
    (tenderedValue > 0 && change < 0);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await settlePaymentAction(orderId, {
        cash: cashValue,
        card,
        tip: tipValue,
        tipMethod,
        waiterId: waiterId || null,
        tendered: tenderedValue > 0 ? tenderedValue : null,
      });
      if (result?.error) setError(result.error);
      else onDone();
    });
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-border p-3 text-sm">
      <p className="text-text-secondary">Ödəniləcək: <span className="font-semibold text-text-primary">{due.toFixed(2)} ₼</span></p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span>Nağd</span>
          <Input type="number" inputMode="decimal" step="0.01" min="0" max={due} value={cash} onChange={(e) => setCash(e.target.value)} placeholder="0" readOnly={cashOnly} />
        </label>
        <label className="flex flex-col gap-1">
          <span>Kart (qalan)</span>
          <Input value={card.toFixed(2)} readOnly aria-readonly />
        </label>
        <label className="flex flex-col gap-1">
          <span>Çay pulu</span>
          <Input type="number" inputMode="decimal" step="0.01" min="0" value={tip} onChange={(e) => setTip(e.target.value)} placeholder="0" />
        </label>
        <label className="flex flex-col gap-1">
          <span>Çay pulu necə verildi</span>
          <select className="h-10 rounded-md border border-border bg-surface px-2" value={tipMethod} onChange={(e) => setTipMethod(e.target.value === "card" ? "card" : "cash")}>
            <option value="cash">Nağd</option>
            <option value="card">Kartla</option>
          </select>
        </label>
      </div>
      {cashNeeded > 0 && (
        <div className="flex flex-col gap-1 rounded-md bg-bg-muted p-2">
          <label className="flex flex-col gap-1">
            <span>Müştəri nağd verdi</span>
            <Input type="number" inputMode="decimal" step="0.01" min="0" value={tendered} onChange={(e) => setTendered(e.target.value)} placeholder={cashNeeded.toFixed(2)} />
          </label>
          {tenderedValue > 0 && change >= 0 && (
            <p className="text-base font-semibold text-text-primary">
              Qaytarılmalı: {change.toFixed(2)} ₼
              <span className="block text-xs font-normal text-text-secondary">Hesaba mədaxil: {cashValue.toFixed(2)} ₼</span>
            </p>
          )}
          {tenderedValue > 0 && change < 0 && <p className="text-danger">Verilən məbləğ çatmır, {Math.abs(change).toFixed(2)} ₼ əskikdir</p>}
        </div>
      )}
      <label className="flex flex-col gap-1">
        <span>{tipValue > 0 ? "Ofisiant (çay pulu və satış ona yazılır)" : "Ofisiant (satış ona yazılsın)"}</span>
        <select className="h-10 rounded-md border border-border bg-surface px-2" value={waiterId} onChange={(e) => setWaiterId(e.target.value)}>
          <option value="">{tipValue > 0 ? "Ofisiant seçin" : "Seçilməyib"}</option>
          {waiters.map((w) => (
            <option key={w.id} value={w.id}>{w.full_name ?? "Ofisiant"}</option>
          ))}
        </select>
      </label>
      {error && <p className="text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" disabled={isPending || invalid} onClick={submit}>Ödənişi qeyd et</Button>
        <Button size="sm" variant="outline" disabled={isPending} onClick={onDone}>Bağla</Button>
      </div>
    </div>
  );
}
