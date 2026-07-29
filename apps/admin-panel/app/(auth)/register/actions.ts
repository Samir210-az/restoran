"use server";

import { redirect } from "next/navigation";
import { slugifyUnique } from "@restoran/utils";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Server Action: qeydiyyat + restoran onboarding-i BIR ATOMIK axinda edir:
 *   1) Supabase Auth-da istifadeci yaradilir (auth.users)
 *   2) `handle_new_user` trigger-i avtomatik `profiles` setri yaradir
 *   3) Sessiya varsa (email tesdiqi tetbiq olunmayibsa), `onboard_restaurant`
 *      RPC-si cagirilir - bu, restaurants + branches + staff_members
 *      setirlerini bir DB tranzaksiyasinda yaradir (bax: onboard_restaurant funksiyasi)
 */
export async function registerAction(formData: FormData) {
  const restaurantName = String(formData.get("restaurantName") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!restaurantName || !fullName || !email || password.length < 8) {
    redirect(
      "/register?error=" + encodeURIComponent("Bütün sahələri düzgün doldurun (şifrə min. 8 simvol)")
    );
  }

  const supabase = getSupabaseServerClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (signUpError) {
    const message =
      signUpError.message === "User already registered"
        ? "Bu e-poçt artıq qeydiyyatdan keçib"
        : "Qeydiyyat zamanı xəta baş verdi";
    redirect("/register?error=" + encodeURIComponent(message));
  }

  // Email tesdiqi aktivdirse, sessiya heleki yoxdur - istifadeci once
  // e-poctunu tesdiqlemelidir. Onboarding ilk giriste tamamlanacaq.
  if (!signUpData.session) {
    redirect("/register/check-email");
  }

  const slug = slugifyUnique(restaurantName);
  // NOT: supabase-js-in .rpc() tip-cixarimi bu setof-olmayan (tek obyekt qaytaran)
  // RPC ucun duzgun overload-u tapa bilmir - runtime-a tesiri yoxdur, args formasi
  // database.types.ts-deki Args ile eynidir. Yalniz bu cagirisi tipsiz buraxiriq.
  const { error: onboardError } = await (
    supabase as unknown as { rpc: (fn: string, args: unknown) => Promise<{ error: { message: string } | null }> }
  ).rpc("onboard_restaurant", {
    _name: restaurantName,
    _slug: slug,
    _default_language: "az",
    _timezone: "Asia/Baku",
  });

  if (onboardError) {
    redirect(
      "/register?error=" +
        encodeURIComponent("Hesab yaradıldı, amma restoran qurulmasında xəta oldu. Dəstəklə əlaqə saxlayın.")
    );
  }

  redirect("/dashboard");
}
