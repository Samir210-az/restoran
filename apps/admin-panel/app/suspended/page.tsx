import { ShieldOff } from "lucide-react";
import { signOutAction } from "@/app/(dashboard)/actions";

export const metadata = { title: "Giriş məhdudlaşdırılıb" };

/**
 * getCurrentStaffContext() restoranin subscription_status-u "suspended"
 * ve ya "cancelled" olanda bura yonlendirir. QESDEN (dashboard) qrupunda
 * DEYIL - eks halda layout.tsx yeniden getCurrentStaffContext() cagirib
 * SONSUZ yonlendirme dovresi yaradardi.
 */
export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger">
        <ShieldOff className="h-8 w-8" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Girişiniz müvəqqəti dayandırılıb</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">
          Restoranınızın abunəliyi platforma tərəfindən dayandırılıb. Zəhmət olmasa hesabınızı bərpa etmək üçün bizimlə əlaqə saxlayın.
        </p>
      </div>
      <a
        href="https://wa.me/994552107111"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
      >
        WhatsApp ilə əlaqə saxla
      </a>
      <form action={signOutAction}>
        <button type="submit" className="text-sm text-text-muted hover:text-text-secondary hover:underline">
          Çıxış et
        </button>
      </form>
    </div>
  );
}
