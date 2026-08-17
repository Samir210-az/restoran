"use server";

import { redirect } from "next/navigation";
import { slugifyUnique } from "@restoran/utils";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * E-poct tesdiqi teleb olundugu ucun qeydiyyat aninda sessiya olmur -
 * ona gore onboard_restaurant RPC-si O AN cagirila bilmir (bax:
 * register/actions.ts). Bu sehife TESDIQDEN SONRA ILK GIRISDE
 * gosterilir ve eyni atomik RPC-ni burada tamamlayir.
 */
export async function completeOnboardingAction(formData: FormData) {
  const restaurantName = String(formData.get("restaurantName") ?? "").trim();
  if (!restaurantName) {
    redirect("/onboarding?error=" + encodeURIComponent("Restoran adı boş ola bilməz"));
  }

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // IDEMPOTENCY YOXLAMASI (bug duzelisi): bu addim evvelce yox idi -
  // istifadeci hansi sebeble olursa olsun (yeniden giris, double-submit
  // ve s.) bu sehifeye ikinci defe dushurse, forma HEC bir yoxlama
  // olmadan HEMISE yeni restoran yaradirdi. Indi: aktiv staff setri
  // artiq varsa, RPC cagirilmadan birbasa dashboard-a yonlendirilir.
  const { data: existingStaffRow } = await supabase
    .from("staff_members")
    .select("id")
    .eq("user_id", user!.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (existingStaffRow) {
    redirect("/dashboard");
  }

  const slug = slugifyUnique(restaurantName);
  const { error } = await (
    supabase as unknown as { rpc: (fn: string, args: unknown) => Promise<{ error: { message: string } | null }> }
  ).rpc("onboard_restaurant", {
    _name: restaurantName,
    _slug: slug,
    _default_language: "az",
    _timezone: "Asia/Baku",
  });

  if (error) {
    redirect("/onboarding?error=" + encodeURIComponent("Xəta baş verdi, yenidən cəhd edin"));
  }

  redirect("/dashboard");
}
