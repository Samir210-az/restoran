"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@restoran/ui";
import { Wallet } from "lucide-react";
import { ROLE_LABELS, STAFF_ROLES, type StaffRole } from "@restoran/types";
import { updateStaffRoleAction, toggleStaffActiveAction, payStaffSalaryAction } from "@/app/(dashboard)/staff/actions";

interface StaffRowProps {
  staffId: string;
  fullName: string | null;
  email: string;
  role: StaffRole;
  isActive: boolean;
  isSelf: boolean;
  canManage: boolean;
}

export function StaffRow({ staffId, fullName, email, role, isActive, isSelf, canManage }: StaffRowProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [isPayFormOpen, setPayFormOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paidMsg, setPaidMsg] = useState<string | null>(null);

  function submitPayment() {
    const value = Number(amount);
    if (!value || value <= 0) return;
    startTransition(async () => {
      await payStaffSalaryAction(staffId, value, note);
      setPaidMsg(`${value.toFixed(2)} ₼ ödənildi və Hesabatlarda qeydə alındı`);
      setAmount("");
      setNote("");
      setPayFormOpen(false);
      router.refresh();
      setTimeout(() => setPaidMsg(null), 4000);
    });
  }

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-text-primary">{fullName ?? email}</p>
          <p className="text-sm text-text-secondary">{email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isActive && <Badge variant="danger">Deaktiv</Badge>}

          {isSelf || !canManage ? (
            <Badge variant="accent">{ROLE_LABELS[role].az}{isSelf ? " (siz)" : ""}</Badge>
          ) : (
            <>
              <button
                disabled={isPending}
                onClick={() => setPayFormOpen((v) => !v)}
                className="flex items-center gap-1 rounded-md border border-border-strong px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-muted"
              >
                <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                Maaş ödə
              </button>

              <select
                value={role}
                disabled={isPending}
                onChange={(e) =>
                  startTransition(async () => {
                    await updateStaffRoleAction(staffId, e.target.value as StaffRole);
                    router.refresh();
                  })
                }
                className="h-8 rounded-md border border-border-strong bg-bg px-2 text-xs text-text-primary"
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r].az}
                  </option>
                ))}
              </select>

              <button
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await toggleStaffActiveAction(staffId, !isActive);
                    router.refresh();
                  })
                }
                className="rounded-md border border-border-strong px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-muted"
              >
                {isActive ? "Deaktiv et" : "Aktivləşdir"}
              </button>
            </>
          )}
        </div>
      </div>

      {isPayFormOpen && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-bg-muted px-3 py-2.5">
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Məbləğ ₼"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-8 w-28 rounded-md border border-border-strong bg-bg px-2 text-xs text-text-primary"
          />
          <input
            type="text"
            placeholder="Qeyd (istəyə bağlı, məs. İyul ayı maaşı)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-8 flex-1 min-w-[160px] rounded-md border border-border-strong bg-bg px-2 text-xs text-text-primary"
          />
          <button
            type="button"
            disabled={isPending || !amount}
            onClick={submitPayment}
            className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground disabled:opacity-50"
          >
            Təsdiqlə
          </button>
        </div>
      )}

      {paidMsg && <p className="text-xs text-success">{paidMsg}</p>}
    </div>
  );
}
