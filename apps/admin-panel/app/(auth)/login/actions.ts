"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Server Action: giris formu birbaşa buraya submit olunur (JS-siz de isleyir).
 * Ugurlu olduqda Supabase sessiya cookie-si avtomatik teyin olunur.
 *
 * YONLENDIRME MENTIQI (bug duzelisi): evvelce HEMISE /dashboard-a
 * gedirdi - bu, restoran-scoped stafften TAMAM ayri olmali platform
 * admin ucun problem yaradirdi: eger platform admin hec bir restoranda
 * aktiv staff deyilse (normal haldir - o, restoran sahibi deyil,
 * platformanin ozudur), /dashboard onu sessiz sekilde /onboarding-e
 * atirdi - orada YANLIŞLIQLA hər hansı ad yazılsa YENİ restoran
 * yaranirdi. Indi: aktiv staff rolu yoxdursa VE platform admin-dirse,
 * birbaşa /platform-a yonlendirilir.
 */
export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=" + encodeURIComponent("E-poçt və şifrə tələb olunur"));
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message =
      error.message === "Invalid login credentials"
        ? "E-poçt və ya şifrə yanlışdır"
        : "Daxil olarkən xəta baş verdi, yenidən cəhd edin";
    redirect("/login?error=" + encodeURIComponent(message));
  }

  const { data: activeStaffRow } = await supabase
    .from("staff_members")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!activeStaffRow) {
    const { data: isPlatformAdmin } = await (
      supabase as unknown as { rpc: (fn: string) => Promise<{ data: boolean | null }> }
    ).rpc("is_platform_admin");
    if (isPlatformAdmin) {
      redirect("/platform");
    }
  }

  redirect("/dashboard");
}
