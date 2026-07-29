"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Server Action: giris formu birbaşa buraya submit olunur (JS-siz de isleyir).
 * Ugurlu olduqda Supabase sessiya cookie-si avtomatik teyin olunur ve
 * /dashboard-a yonlendirilir. Xeta olduqda eyni sehifeye error mesaji ile qayidir.
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

  redirect("/dashboard");
}
