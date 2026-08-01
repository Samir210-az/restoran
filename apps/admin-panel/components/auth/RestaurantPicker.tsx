"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertCircle, Search, UtensilsCrossed } from "lucide-react";
import { Input } from "@restoran/ui";
import { selectDeviceRestaurantAction, type LoginDirectoryRestaurant } from "@/app/(auth)/login/pin-actions";

/**
 * Bu cihazda İLK DƏFƏ açılan ekran - bir dəfə restoran seçiləndən sonra
 * cihaz ona bağlanır (bax: selectDeviceRestaurantAction, ~400 gün
 * kuki) və bu ekran bir daha görünmür, birbaşa RoleLoginGate açılır.
 */
export function RestaurantPicker({
  restaurants,
  error,
}: {
  restaurants: LoginDirectoryRestaurant[];
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = restaurants.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Bu cihazı hansı restorana bağlayaq?</h1>
        <p className="mt-1 text-sm text-text-secondary">Bir dəfə seçin — bu cihaz həmişə həmin restoran üçün istifadə olunacaq</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-danger/10 p-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Restoran adını yazın..."
          className="pl-9"
          autoFocus
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-text-secondary">
          <UtensilsCrossed className="h-8 w-8 text-text-muted" aria-hidden="true" />
          Uyğun restoran tapılmadı
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((r) => (
            <form key={r.id} action={selectDeviceRestaurantAction}>
              <input type="hidden" name="slug" value={r.slug} />
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-bg p-3 text-left transition-transform hover:border-accent hover:bg-accent-soft active:scale-[0.98]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-accent">
                  {r.logo_url ? (
                    <Image src={r.logo_url} alt="" width={44} height={44} className="h-full w-full object-cover" />
                  ) : (
                    <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
                <span className="text-sm font-medium text-text-primary">{r.name}</span>
              </button>
            </form>
          ))}
        </div>
      )}

      <p className="text-center text-sm text-text-secondary">
        Hesabınız yoxdur?{" "}
        <a
          href="https://wa.me/994552107111"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent hover:underline"
        >
          Qeydiyyat üçün müraciət edin
        </a>
      </p>
      <a href="/login/admin" className="text-center text-xs text-text-muted hover:text-text-secondary hover:underline">
        Platform admin girişi
      </a>
    </div>
  );
}
