"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input } from "@restoran/ui";
import { createSupabaseBrowserClient } from "@restoran/supabase-client";
import { slugify, logger } from "@restoran/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const restaurantName = String(formData.get("restaurantName") ?? "").trim();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const supabase = createSupabaseBrowserClient();

      // 1. Hesab yarat
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError) throw signUpError;
      if (!signUpData.session) {
        // E-poçt tesdiqi aktivdirse, sessiya burada olmaya biler
        setFormError("Qeydiyyat uğurludur. E-poçtunuzu təsdiqləyin, sonra daxil olun.");
        setSubmitting(false);
        return;
      }

      // 2. Restoran (tenant) yarat - RPC serverdə owner_id-ni auth.uid()-dən özü təyin edir
      const slug = slugify(restaurantName) || slugify(email.split("@")[0]);
      const { error: rpcError } = await supabase.rpc("onboard_restaurant", {
        _name: restaurantName,
        _slug: slug,
      });
      if (rpcError) throw rpcError;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Qeydiyyat zamanı xəta baş verdi";
      logger.error("Restoran qeydiyyatı uğursuz oldu", { message });
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Restoranınızı qeydiyyatdan keçirin</h1>
        <p className="mt-1 text-sm text-text-secondary">Bir neçə dəqiqədə platformaya başlayın</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input label="Restoran adı" type="text" name="restaurantName" placeholder="Məs. Ləzzət Sarayı" required />
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

        {formError && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
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
