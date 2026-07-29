"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Bell, LogOut, Shield } from "lucide-react";
import { ThemeToggle } from "@restoran/ui";
import { ROLE_LABELS, type StaffRole } from "@restoran/types";
import { signOutAction } from "@/app/(dashboard)/actions";

interface TopbarProps {
  onMenuClick: () => void;
  restaurantName: string;
  role: StaffRole;
  isPlatformAdmin?: boolean;
}

export function Topbar({ onMenuClick, restaurantName, role, isPlatformAdmin }: TopbarProps) {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const initial = restaurantName?.charAt(0)?.toUpperCase() || "R";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-bg/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Naviqasiya menyusunu aç"
          className="rounded-md p-2 text-text-secondary hover:bg-bg-muted md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden md:block">
          <p className="text-sm font-medium text-text-primary">{restaurantName}</p>
          <p className="text-xs text-text-muted">{ROLE_LABELS[role].az}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label="Bildirişlər"
          className="relative rounded-md p-2 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" aria-hidden="true" />
        </button>
        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="ml-1 h-9 w-9 rounded-full bg-accent-soft text-center text-sm font-medium leading-9 text-accent"
            aria-label="Hesab menyusu"
            aria-expanded={isMenuOpen}
          >
            {initial}
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-11 w-48 rounded-md border border-border bg-bg-elevated py-1 shadow-elevated animate-fade-in">
              {isPlatformAdmin && (
                <Link
                  href="/platform"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-secondary hover:bg-bg-muted hover:text-accent"
                >
                  <Shield className="h-4 w-4" aria-hidden="true" />
                  Platform Admin
                </Link>
              )}
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-secondary hover:bg-bg-muted hover:text-danger"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Çıxış et
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
