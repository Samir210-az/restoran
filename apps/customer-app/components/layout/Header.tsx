"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { ThemeToggle } from "@restoran/ui";

/**
 * Musteri tetbiqinin ustluyu. Admin panelden ferqli olaraq sadedir -
 * musteri ucun esas meqsed menyunu tez gormek ve sebete keçmekdir,
 * naviqasiya menyusuna ehtiyac yoxdur.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-bg/80 px-4 backdrop-blur-md md:px-6">
      <Link href="/" className="text-lg font-semibold tracking-tight text-text-primary">
        Restoran<span className="text-accent">.</span>
      </Link>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          aria-label="Səbət"
          className="relative rounded-md p-2 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
        >
          <ShoppingBag className="h-5 w-5" />
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground"
            aria-hidden="true"
          >
            0
          </span>
        </button>
      </div>
    </header>
  );
}
