import Link from "next/link";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { Button, Input } from "@restoran/ui";
import { loginAction } from "../actions";

export const metadata = { title: "Platform admin girişi" };

/**
 * Ad+PIN axini restoran işçiləri ucundur (bax: RoleLoginGate). Platform
 * admin (Samir) heç bir restorana bağlı OLMAMALIDIR (bax: SAD), ona
 * gore o burada, klassik e-poçt+şifrə ilə daxil olur.
 */
export default function AdminLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/login" className="mb-3 flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary">
          <ChevronLeft className="h-3.5 w-3.5" /> Geri
        </Link>
        <h1 className="text-xl font-semibold text-text-primary">Platform admin girişi</h1>
        <p className="mt-1 text-sm text-text-secondary">E-poçt və şifrənizlə daxil olun</p>
      </div>

      {searchParams.error && (
        <div className="flex items-start gap-2 rounded-md bg-danger/10 p-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{searchParams.error}</span>
        </div>
      )}

      <form action={loginAction} className="flex flex-col gap-4">
        <Input label="E-poçt" type="email" name="email" placeholder="siz@restoran.az" autoComplete="email" required autoFocus />
        <Input label="Şifrə" type="password" name="password" placeholder="••••••••" autoComplete="current-password" required />
        <Button type="submit" className="w-full" size="lg">
          Daxil ol
        </Button>
      </form>
    </div>
  );
}
