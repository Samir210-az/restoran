"use client";

import { useTransition } from "react";
import { Badge } from "@restoran/ui";
import { ROLE_LABELS, STAFF_ROLES, type StaffRole } from "@restoran/types";
import { updateStaffRoleAction, toggleStaffActiveAction } from "@/app/(dashboard)/staff/actions";

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

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="font-medium text-text-primary">{fullName ?? email}</p>
        <p className="text-sm text-text-secondary">{email}</p>
      </div>

      <div className="flex items-center gap-3">
        {!isActive && <Badge variant="danger">Deaktiv</Badge>}

        {isSelf || !canManage ? (
          <Badge variant="accent">{ROLE_LABELS[role].az}{isSelf ? " (siz)" : ""}</Badge>
        ) : (
          <>
            <select
              value={role}
              disabled={isPending}
              onChange={(e) =>
                startTransition(() => updateStaffRoleAction(staffId, e.target.value as StaffRole))
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
              onClick={() => startTransition(() => toggleStaffActiveAction(staffId, !isActive))}
              className="rounded-md border border-border-strong px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-muted"
            >
              {isActive ? "Deaktiv et" : "Aktivləşdir"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
