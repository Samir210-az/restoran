"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Table2,
  Package,
  Users,
  Heart,
  BarChart3,
  Sparkles,
  Settings,
} from "lucide-react";
import { cn } from "@restoran/utils";
import { LogoutButton } from "./LogoutButton";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Ana Səhifə", icon: LayoutDashboard },
  { href: "/orders", label: "Sifarişlər", icon: ClipboardList },
  { href: "/menu", label: "Menyu", icon: UtensilsCrossed },
  { href: "/tables", label: "Masalar", icon: Table2 },
  { href: "/inventory", label: "Anbar", icon: Package },
  { href: "/staff", label: "İşçilər", icon: Users },
  { href: "/customers", label: "Müştərilər", icon: Heart },
  { href: "/reports", label: "Hesabatlar", icon: BarChart3 },
  { href: "/ai-insights", label: "AI Kəşfiyyat", icon: Sparkles },
  { href: "/settings", label: "Parametrlər", icon: Settings },
] as const;

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  restaurantName?: string;
}

/**
 * Naviqasiya siyahisi SAD-in "10. UI/UX Struktur -> Admin Panel" bolmesi
 * ile bire-bir uygundur. Yeni modul elave olunanda YALNIZ bu massivi
 * genisletmek kifayetdir - Sidebar ve MobileNav avtomatik sync qalir.
 */
export function Sidebar({ className, onNavigate, restaurantName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex h-full flex-col p-4", className)} aria-label="Əsas naviqasiya">
      <div className="mb-6 px-2">
        <span className="block text-xl font-semibold tracking-tight text-text-primary">
          Restoran<span className="text-accent">.</span>
        </span>
        {restaurantName && (
          <span className="mt-0.5 block truncate text-xs text-text-muted">{restaurantName}</span>
        )}
      </div>

      <div className="flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent-soft text-accent"
                  : "text-text-secondary hover:bg-bg-muted hover:text-text-primary"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto border-t border-border pt-2">
        <LogoutButton />
      </div>
    </nav>
  );
}
