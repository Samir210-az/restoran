"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@restoran/ui";
import { createSupabaseBrowserClient } from "@restoran/supabase-client";
import { slugify } from "@restoran/utils";

export const dynamic = "force-dynamic";

/**
 * Qeydiyyatdan sonrakı ILK addım: tenant (restaurants setri) ve
 * owner rolunda staff_members setri burada yaranir. Bu, SAD-daki
 * "Faza 1: Restoran onboarding axını" telebinin real implementasiyasidir.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const restaurantName = String(formData.get("restaurantName") ?? "").trim();

    if (!restaurantName) {
      setError("Restoran adı boş ola bilməz");
      setIsLoading(false);
      return;
    }

    const slug = `${slugify(restaurantName)}-${user.id.slice(0, 6)}`;

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .insert({ owner_id: user.id, name: restaurantName, slug })
      .select()
      .single();

    if (restaurantError || !restaurant) {
      setError("Restoran yaradılarkən xəta baş verdi. Yenidən cəhd edin");
      setIsLoading(false);
      return;
    }

    const { error: staffError } = await supabase
      .from("staff_members")
      .insert({ user_id: user.id, restaurant_id: restaurant.id, role: "owner" });

    if (staffError) {
      setError("İşçi qeydi yaradılarkən xəta baş verdi. Dəstəklə əlaqə saxlayın");
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Restoranınızı quraşdırın</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Sadəcə bir addım qalıb — restoranınızın adını daxil edin
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          label="Restoran adı"
          type="text"
          name="restaurantName"
          placeholder="Məs. Ləzzət Sarayı"
          autoFocus
          required
        />
        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Davam et
        </Button>
      </form>
    </div>
  );
}
