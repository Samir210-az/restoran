import Link from "next/link";
import { Button, Input } from "@restoran/ui";

export const metadata = { title: "Daxil ol" };

/**
 * UI-ONLY: Bu formanin submit menteqi (Supabase auth.signInWithPassword)
 * Faza 2-de elave olunacaq. Hazirda yalniz vizual struktur ve
 * client-side dogrulama üçün zeruri atributlar mövcuddur.
 */
export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Hesabınıza daxil olun</h1>
        <p className="mt-1 text-sm text-text-secondary">Restoranınızı idarə etməyə davam edin</p>
      </div>

      <form className="flex flex-col gap-4" noValidate>
        <Input label="E-poçt" type="email" name="email" placeholder="siz@restoran.az" autoComplete="email" required />
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

      <p className="text-center text-sm text-text-secondary">
        Hesabınız yoxdur?{" "}
        <Link href="/register" className="font-medium text-accent hover:underline">
          Qeydiyyatdan keçin
        </Link>
      </p>
    </div>
  );
}
