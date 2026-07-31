"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Bell, LogOut, Shield, ShoppingBag, CalendarCheck } from "lucide-react";
import { ThemeToggle } from "@restoran/ui";
import { ROLE_LABELS, type StaffRole } from "@restoran/types";
import { createSupabaseBrowserClient } from "@restoran/supabase-client";
import { signOutAction } from "@/app/(dashboard)/actions";

interface TopbarProps {
  onMenuClick: () => void;
  restaurantName: string;
  restaurantId: string;
  role: StaffRole;
  isPlatformAdmin?: boolean;
}

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

/**
 * Bildiriş merkezi: yeni sifariş/rezervasiya gelende restoran-scoped
 * "broadcast" bildiriş yaranir (bax: DB-deki trg_notify_new_order/
 * trg_notify_new_reservation trigger-leri). Bura ANCAQ real vaxtli
 * (Supabase Realtime) UNDS - hec bir push/SMS deyil, tetbiq acig
 * pencerede oldugda gorunur (ilk MVP).
 */
export function Topbar({ onMenuClick, restaurantName, restaurantId, role, isPlatformAdmin }: TopbarProps) {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const initial = restaurantName?.charAt(0)?.toUpperCase() || "R";
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase
      .from("notifications")
      .select("id, type, title, body, is_read, created_at")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(15)
      .then(({ data }) => {
        if (data) setNotifications(data as NotificationRow[]);
      });

    const channel = supabase
      .channel(`notifications-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          setNotifications((prev) => [payload.new as NotificationRow, ...prev].slice(0, 15));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  async function handleBellClick() {
    setNotifOpen((v) => !v);
    if (!isNotifOpen && unreadCount > 0) {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("notifications").update({ is_read: true }).eq("restaurant_id", restaurantId).eq("is_read", false);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  }

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
        <div className="relative">
          <button
            onClick={handleBellClick}
            aria-label="Bildirişlər"
            aria-expanded={isNotifOpen}
            className="relative rounded-md p-2 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-11 max-h-96 w-80 overflow-y-auto rounded-md border border-border bg-bg-elevated py-1 shadow-elevated animate-fade-in">
              <p className="px-3 py-2 text-xs font-semibold text-text-secondary">Bildirişlər</p>
              {notifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-text-muted">Hələ bildiriş yoxdur</p>
              ) : (
                notifications.map((n) => {
                  const Icon = n.type === "new_reservation" ? CalendarCheck : ShoppingBag;
                  const href = n.type === "new_reservation" ? "/reservations" : "/orders";
                  return (
                    <Link
                      key={n.id}
                      href={href}
                      onClick={() => setNotifOpen(false)}
                      className="flex items-start gap-2.5 border-t border-border px-3 py-2.5 first:border-t-0 hover:bg-bg-muted"
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary">{n.title}</p>
                        {n.body && <p className="truncate text-xs text-text-secondary">{n.body}</p>}
                        <p className="mt-0.5 text-[10px] text-text-muted">
                          {new Date(n.created_at).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>

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
