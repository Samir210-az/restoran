import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button, Input } from "@restoran/ui";
import { loginAction } from "./actions";

export const metadata = { title: "Daxil ol" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Hesabınıza daxil olun</h1>
        <p className="mt-1 text-sm text-text-secondary">Restoranınızı idarə etməyə davam edin</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-danger/10 p-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form action={loginAction} className="flex flex-col gap-4">
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
