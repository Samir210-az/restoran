"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Shield, Users, ClipboardList, ChefHat, Wallet, ChevronLeft } from "lucide-react";
import { Button, Input } from "@restoran/ui";
import { loginAction } from "@/app/(auth)/login/actions";

const ROLE_TILES = [
  { key: "owner", label: "Administrator", icon: Shield },
  { key: "manager", label: "Menecer", icon: Users },
  { key: "waiter", label: "Ofisiant", icon: ClipboardList },
  { key: "chef", label: "Aşpaz", icon: ChefHat },
  { key: "cashier", label: "Kassir", icon: Wallet },
] as const;

/**
 * QEYD: Bu rol sechimi YALNIZ vizual bir baxis nöqtesidir - hansi rolun
 * icaze aldigi HEQIQETEN verilenler bazasindaki staff_members setrinden
 * müeyyen olunur (bax: getCurrentStaffContext). Yeni istifadeci "Ofisiant"a
 * bassa da, DB-de "manager" kimi qeydiyyatdadirsa, giris edende yene
 * manager kimi daxil olacaq - bu sadece iscinin ozunu tez tapmasi ucun
 * bir rahatliq addimidir, tehlukesizlik sinirini teskil etmir.
 */
export function RoleLoginGate({ error }: { error?: string }) {
  const [selectedRole, setSelectedRole] = useState<(typeof ROLE_TILES)[number] | null>(null);

  if (!selectedRole) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Kim kimi daxil olursunuz?</h1>
          <p className="mt-1 text-sm text-text-secondary">Öz sahənizi seçin, sonra e-poçt/şifrənizlə davam edin</p>
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
          <div>
            <h1 className="text-lg font-semibold text-text-primary">{selectedRole.label} kimi daxil olun</h1>
            <p className="text-xs text-text-secondary">E-poçt/istifadəçi adınız və şifrənizlə davam edin</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-danger/10 p-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form action={loginAction} className="flex flex-col gap-4">
        <Input label="E-poçt" type="email" name="email" placeholder="siz@restoran.az" autoComplete="email" required autoFocus />
        <Input
          label="Şifrə"
          type="password"
          name="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-text-secondary">
            <input type="checkbox" name="remember" className="h-4 w-4 rounded border-border-strong accent-accent" />
            Məni xatırla
          </label>
          <Link href="/forgot-password" className="font-medium text-accent hover:underline">
            Şifrəni unutmusunuz?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg">
          Daxil ol
        </Button>
      </form>
    </div>
  );
}
