"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { StaffRole } from "@restoran/types";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface DashboardShellProps {
  children: React.ReactNode;
  restaurantId: string;
  restaurantName: string;
  role: StaffRole;
  isPlatformAdmin?: boolean;
}

export function DashboardShell({ children, restaurantId, restaurantName, role, isPlatformAdmin }: DashboardShellProps) {
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-64 shrink-0 border-r border-border md:block">
        <Sidebar restaurantName={restaurantName} role={role} />
      </aside>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 animate-slide-up bg-bg-elevated shadow-elevated">
            <div className="flex justify-end p-3">
              <button
                onClick={() => setMobileNavOpen(false)}
                aria-label="Menyunu bağla"
                className="rounded-md p-2 text-text-secondary hover:bg-bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar onNavigate={() => setMobileNavOpen(false)} restaurantName={restaurantName} role={role} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() => setMobileNavOpen(true)}
          restaurantId={restaurantId}
          restaurantName={restaurantName}
          role={role}
          isPlatformAdmin={isPlatformAdmin}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
