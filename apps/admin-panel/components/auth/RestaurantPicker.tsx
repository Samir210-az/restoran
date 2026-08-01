"use client";

import { AlertCircle, KeyRound, UtensilsCrossed } from "lucide-react";
import { Input, Button } from "@restoran/ui";
import { selectDeviceRestaurantAction } from "@/app/(auth)/login/pin-actions";

/**
 * Bu cihazda İLK DƏFƏ açılan ekran - Samir-in qərarı: restoran
 * ictimai siyahıdan SEÇİLMİR (bu, bütün müştəri adlarını hər kəsə
 * açardı), əvəzində "ad + gizli kod" yazılır. Bir dəfə düzgün
 * daxil ediləndən sonra cihaz həmin restorana bağlanır (bax:
 * selectDeviceRestaurantAction, ~400 gün kuki) və bu ekran bir daha
 * görünmür.
 */
export function RestaurantPicker({ error }: { error?: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <UtensilsCrossed className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-text-primary">Bu cihazı restorana bağlayın</h1>
        <p className="mt-1 text-sm text-text-secondary">Bir dəfə daxil edin — bu cihaz həmişə həmin restoran üçün istifadə olunacaq</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-danger/10 p-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form action={selectDeviceRestaurantAction} className="flex flex-col gap-4">
        <Input name="restaurant_name" placeholder="Restoranın adı" required autoFocus />
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
          <Input name="restaurant_code" placeholder="Restoran kodu" className="pl-9" required />
        </div>
        <Button type="submit" size="lg" className="w-full">
          Davam et
        </Button>
      </form>

      <p className="text-center text-xs text-text-muted">
        Restoran kodunu bilmirsinizsə, sahib və ya menecerinizdən soruşun (Ayarlar bölməsində görünür)
      </p>

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
    </div>
  );
}
