import Link from "next/link";
import { Button, Input } from "@restoran/ui";

export const metadata = { title: "Qeydiyyat" };

/**
 * UI-ONLY: Restoran onboarding menteqi (tenant yaratma) Faza 2-de
 * `/functions/onboard-restaurant` Edge Function-u ile qosulacaq.
 */
export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Restoranınızı qeydiyyatdan keçirin</h1>
        <p className="mt-1 text-sm text-text-secondary">Bir neçə dəqiqədə platformaya başlayın</p>
      </div>

      <form className="flex flex-col gap-4" noValidate>
        <Input label="Restoran adı" type="text" name="restaurantName" placeholder="Məs. Lezzet Sarayı" required />
        <Input label="Ad Soyad" type="text" name="fullName" placeholder="Adınız Soyadınız" required />
        <Input label="E-poçt" type="email" name="email" placeholder="siz@restoran.az" autoComplete="email" required />
        <Input
          label="Şifrə"
          type="password"
          name="password"
          placeholder="Minimum 8 simvol"
          autoComplete="new-password"
          minLength={8}
          required
        />

        <label className="flex items-start gap-2 text-sm text-text-secondary">
          <input type="checkbox" name="terms" required className="mt-0.5 h-4 w-4 rounded border-border-strong accent-accent" />
          <span>
            <Link href="/terms" className="font-medium text-accent hover:underline">
              İstifadə şərtləri
            </Link>{" "}
            ilə razıyam
          </span>
        </label>

        <Button type="submit" className="w-full" size="lg">
          Hesab yarat
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Artıq hesabınız var?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Daxil olun
        </Link>
      </p>
    </div>
  );
}
