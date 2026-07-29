import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind class-larini tehlukesiz birlesdirir.
 * Meselen: cn("px-2", isActive && "bg-accent", "px-4") -> "bg-accent px-4"
 * (sonuncu px-4 birincini avtomatik evez edir, conflict yaranmir)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
