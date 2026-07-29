"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input } from "@restoran/ui";
import { createSupabaseBrowserClient } from "@restoran/supabase-client";
import { logger } from "@restoran/utils";

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Daxil olarkən xəta baş verdi";
      logger.error("Daxil olma cəhdi uğursuz oldu", { message });
      setFormError("E-poçt və ya şifrə yanlışdır");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Hesabınıza daxil olun</h1>
        <p className="mt-1 text-sm text-text-secondary">Restoranınızı idarə etməyə davam edin</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
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

        {formError && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
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
