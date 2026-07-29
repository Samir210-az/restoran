"use client";

import { Menu, Bell } from "lucide-react";
import { ThemeToggle } from "@restoran/ui";

interface TopbarProps {
  onMenuClick: () => void;
  initials?: string;
}

export function Topbar({ onMenuClick, initials = "?" }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-bg/80 px-4 backdrop-blur-md md:px-6">
      <button
        onClick={onMenuClick}
        aria-label="Naviqasiya menyusunu aç"
        className="rounded-md p-2 text-text-secondary hover:bg-bg-muted md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        <button
          aria-label="Bildirişlər"
          className="relative rounded-md p-2 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" aria-hidden="true" />
        </button>
        <ThemeToggle />
        <div
          className="ml-1 h-9 w-9 rounded-full bg-accent-soft text-center text-sm font-medium leading-9 text-accent"
          aria-hidden="true"
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
