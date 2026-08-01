"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Shield, Users, ClipboardList, ChefHat, Wallet, ChevronLeft, Delete } from "lucide-react";
import { createSupabasePublicClient } from "@restoran/supabase-client";
import {
  staffPinLoginAction,
  clearDeviceRestaurantAction,
  type LoginDirectoryRestaurant,
  type StaffLoginName,
} from "@/app/(auth)/login/pin-actions";

const ROLE_TILES = [
  { key: "owner", label: "Administrator", icon: Shield },
  { key: "manager", label: "Menecer", icon: Users },
  { key: "waiter", label: "Ofisiant", icon: ClipboardList },
  { key: "chef", label: "Aşpaz", icon: ChefHat },
  { key: "cashier", label: "Kassir", icon: Wallet },
] as const;

const PIN_LENGTH = 6;

/**
 * QEYD: Bu rol sechimi YALNIZ vizual bir baxis nöqtesidir - hansi rolun
 * icaze aldigi HEQIQETEN verilenler bazasindaki staff_members setrinden
 * müeyyen olunur. Bu cihaz artiq BIR restorana baglidir (bax:
 * selectDeviceRestaurantAction) - istifadeci email/parol YAZMIR, rolunu
 * secir, sonra oz adini (kart) tapib qisa PIN yazir.
 */
export function RoleLoginGate({ restaurant, error }: { restaurant: LoginDirectoryRestaurant; error?: string }) {
  const [selectedRole, setSelectedRole] = useState<(typeof ROLE_TILES)[number] | null>(null);
  const [names, setNames] = useState<StaffLoginName[] | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffLoginName | null>(null);
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (!selectedRole) return;
    let cancelled = false;
    const supabase = createSupabasePublicClient();
    (
      supabase as unknown as {
        rpc: (fn: string, args: unknown) => Promise<{ data: StaffLoginName[] | null }>;
      }
    )
      .rpc("get_staff_login_names", { _restaurant_id: restaurant.id })
      .then(({ data }) => {
        if (!cancelled) setNames((data ?? []).filter((n) => n.role === selectedRole.key));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRole, restaurant.id]);

  // Ekran 1: rol secimi
  if (!selectedRole) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          {restaurant.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={restaurant.logo_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
          )}
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Kim daxil olur?</h1>
            <p className="text-sm text-text-secondary">{restaurant.name}</p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md bg-danger/10 p-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {ROLE_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.key}
                onClick={() => setSelectedRole(tile)}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-bg p-4 text-center transition-transform hover:border-accent hover:bg-accent-soft active:scale-95"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-xs font-medium text-text-primary">{tile.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-2 text-center text-sm text-text-secondary">
          <span>
            Hesabınız yoxdur?{" "}
            <a
              href="https://wa.me/994552107111"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:underline"
            >
              Qeydiyyat üçün müraciət edin
            </a>
          </span>
          <form action={clearDeviceRestaurantAction}>
            <button type="submit" className="text-xs text-text-muted hover:text-text-secondary hover:underline">
              Bu restoran deyil? Cihazı sıfırla
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Ekran 2: ad secimi
  if (!selectedStaff) {
    const Icon = selectedRole.icon;
    return (
      <div className="flex flex-col gap-6">
        <div>
          <button
            onClick={() => setSelectedRole(null)}
            className="mb-3 flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Geri
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-semibold text-text-primary">{selectedRole.label} — adınızı seçin</h1>
          </div>
        </div>

        {names === null ? (
          <p className="py-6 text-center text-sm text-text-secondary">Yüklənir...</p>
        ) : names.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-secondary">
            Bu roldə heç bir işçi tapılmadı. Platform admin ilə əlaqə saxlayın.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {names.map((n) => (
              <button
                key={n.staff_id}
                onClick={() => setSelectedStaff(n)}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-bg p-4 text-center transition-transform hover:border-accent hover:bg-accent-soft active:scale-95"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                  {n.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-text-primary">{n.full_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Ekran 3: PIN
  function pressDigit(d: string) {
    setPin((prev) => (prev.length < PIN_LENGTH ? prev + d : prev));
  }
  function backspace() {
    setPin((prev) => prev.slice(0, -1));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          onClick={() => {
            setSelectedStaff(null);
            setPin("");
          }}
          className="mb-3 flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Geri
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
            {selectedStaff.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">{selectedStaff.full_name}</h1>
            <p className="text-xs text-text-secondary">PIN kodunuzu daxil edin</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-danger/10 p-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-center gap-2.5">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`h-3.5 w-3.5 rounded-full border-2 ${i < pin.length ? "border-accent bg-accent" : "border-border-strong"}`}
          />
        ))}
      </div>

      <div className="mx-auto grid w-full max-w-[280px] grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => pressDigit(d)}
            className="flex h-16 items-center justify-center rounded-xl border border-border bg-bg text-xl font-medium text-text-primary transition-colors hover:bg-bg-muted active:scale-95"
          >
            {d}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => pressDigit("0")}
          className="flex h-16 items-center justify-center rounded-xl border border-border bg-bg text-xl font-medium text-text-primary transition-colors hover:bg-bg-muted active:scale-95"
        >
          0
        </button>
        <button
          type="button"
          onClick={backspace}
          aria-label="Sil"
          className="flex h-16 items-center justify-center rounded-xl border border-border bg-bg text-text-secondary transition-colors hover:bg-bg-muted active:scale-95"
        >
          <Delete className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <form action={staffPinLoginAction}>
        <input type="hidden" name="staff_id" value={selectedStaff.staff_id} />
        <input type="hidden" name="restaurant_id" value={restaurant.id} />
        <input type="hidden" name="pin" value={pin} />
        <button
          type="submit"
          disabled={pin.length !== PIN_LENGTH}
          className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        >
          Daxil ol
        </button>
      </form>
    </div>
  );
}
