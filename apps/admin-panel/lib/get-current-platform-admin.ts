import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "./supabase-server";

/**
 * Platform Admin - restoran-scoped stafften TAMAM ayri, daha yuksek
 * severiyyeli roldur (SAD bolme 6). platform_admins cedvelinde qeydi
 * olan istifadeciler butun restoranlari gore biler.
 */
export async function requirePlatformAdmin() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: isAdmin } = await supabase.rpc("is_platform_admin");

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return { userId: user.id };
}
