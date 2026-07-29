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
import type { StaffRole } from "@restoran/types";
import { cn } from "@restoran/utils";
import { LogoutButton } from "./LogoutButton";

/**
 * Her naviqasiya maddesi hansi rollara gorunecegini `roles` sahesinde
 * beyan edir. SAD bolme 6 (Istifadeci Rollari ve Icazeler) ile bire-bir
 * uygundur: kassir/aspaz/ofisiant is idareetmesi ekranlarini (Isciler,
 * Hesabatlar, Parametrler) gormemelidir.
 */
const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: StaffRole[];
}> = [
  { href: "/dashboard", label: "Ana Səhifə", icon: LayoutDashboard, roles: ["owner", "manager", "cashier", "chef", "waiter"] },
  { href: "/orders", label: "Sifarişlər", icon: ClipboardList, roles: ["owner", "manager", "cashier", "chef", "waiter"] },
  { href: "/menu", label: "Menyu", icon: UtensilsCrossed, roles: ["owner", "manager"] },
  { href: "/tables", label: "Masalar", icon: Table2, roles: ["owner", "manager", "waiter"] },
  { href: "/inventory", label: "Anbar", icon: Package, roles: ["owner", "manager"] },
  { href: "/staff", label: "İşçilər", icon: Users, roles: ["owner", "manager"] },
  { href: "/customers", label: "Müştərilər", icon: Heart, roles: ["owner", "manager"] },
  { href: "/reports", label: "Hesabatlar", icon: BarChart3, roles: ["owner", "manager"] },
  { href: "/ai-insights", label: "AI Kəşfiyyat", icon: Sparkles, roles: ["owner", "manager"] },
  { href: "/settings", label: "Parametrlər", icon: Settings, roles: ["owner", "manager"] },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  restaurantName?: string;
  role?: StaffRole;
}

/**
 * Naviqasiya siyahisi SAD-in "10. UI/UX Struktur -> Admin Panel" bolmesi
 * ile bire-bir uygundur. Yeni modul elave olunanda YALNIZ bu massivi
 * genisletmek kifayetdir - Sidebar ve MobileNav avtomatik sync qalir.
 *
 * QEYD: Bu, YALNIZ UI qatinda gizletmedir (UX ucun). Hemin route-lara
 * birbasa URL ile gedilse belletde, real qoruma RLS ve server action-larda
 * (getCurrentStaffContext + has_role_in) tetbiq olunur - bu siyahi
 * tehlukesizlik sinirini teskil etmir.
 */
export function Sidebar({ className, onNavigate, restaurantName, role }: SidebarProps) {
  const pathname = usePathname();
  const visibleItems = role ? NAV_ITEMS.filter((item) => item.roles.includes(role)) : NAV_ITEMS;

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
        {visibleItems.map(({ href, label, icon: Icon }) => {
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
