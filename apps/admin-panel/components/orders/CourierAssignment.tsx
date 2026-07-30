"use client";

import { useState, useTransition } from "react";
import { Bike, Check } from "lucide-react";
import { assignCourierAction } from "@/app/(dashboard)/orders/actions";

interface CourierOption {
  id: string;
  full_name: string | null;
}

interface CourierAssignmentProps {
  orderId: string;
  couriers: CourierOption[];
  currentCourierId: string | null;
  currentCourierName: string | null;
  currentCourierPhone: string | null;
}

/**
 * Hem restoranin OZ kuryer-rollu isçisini (dropdown), hem de sistemde
 * hesabi olmayan ad-hoc kuryerin ad+telefonunu (manual sahe) qebul edir.
 * Movcud teyinat varsa, xulase kimi gorunur - deyismek ucun tiklamaq
 * lazimdir.
 */
export function CourierAssignment({
  orderId,
  couriers,
  currentCourierId,
  currentCourierName,
  currentCourierPhone,
}: CourierAssignmentProps) {
  const [isEditing, setEditing] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(currentCourierId ?? "");
  const [manualName, setManualName] = useState(currentCourierName ?? "");
  const [manualPhone, setManualPhone] = useState(currentCourierPhone ?? "");
  const [isPending, startTransition] = useTransition();

  const hasAssignment = Boolean(currentCourierId || currentCourierName);
  const assignedLabel = currentCourierId
    ? (couriers.find((c) => c.id === currentCourierId)?.full_name ?? "Kuryer")
    : currentCourierName;

  function submit() {
    startTransition(async () => {
      await assignCourierAction(orderId, {
        courierId: selectedStaffId || undefined,
        courierName: selectedStaffId ? undefined : manualName,
        courierPhone: selectedStaffId ? undefined : manualPhone,
      });
      setEditing(false);
    });
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 rounded-md border border-border-strong px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-muted"
      >
        <Bike className="h-3.5 w-3.5" aria-hidden="true" />
        {hasAssignment ? `Kuryer: ${assignedLabel}` : "Kuryer təyin et"}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-bg-muted px-3 py-2.5">
      {couriers.length > 0 && (
        <select
          value={selectedStaffId}
          onChange={(e) => {
            setSelectedStaffId(e.target.value);
            if (e.target.value) {
              setManualName("");
              setManualPhone("");
            }
          }}
          className="h-8 rounded-md border border-border-strong bg-bg px-2 text-xs text-text-primary"
        >
          <option value="">— Öz kuryerimiz yoxdur / kənar —</option>
          {couriers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name ?? "Adsız kuryer"}
            </option>
          ))}
        </select>
      )}

      {!selectedStaffId && (
        <>
          <input
            type="text"
            placeholder="Kuryerin adı"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            className="h-8 w-28 rounded-md border border-border-strong bg-bg px-2 text-xs text-text-primary"
          />
          <input
            type="tel"
            placeholder="Telefonu"
            value={manualPhone}
            onChange={(e) => setManualPhone(e.target.value)}
            className="h-8 w-28 rounded-md border border-border-strong bg-bg px-2 text-xs text-text-primary"
          />
        </>
      )}

      <button
        type="button"
        disabled={isPending}
        onClick={submit}
        className="flex h-8 items-center gap-1 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        Təsdiqlə
      </button>
    </div>
  );
}
