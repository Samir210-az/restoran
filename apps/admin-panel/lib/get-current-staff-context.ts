import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "./supabase-server";

export interface StaffContext {
  userId: string;
  fullName: string | null;
  restaurantId: string;
  restaurantName: string;
  role: "owner" | "manager" | "cashier" | "chef" | "waiter";
}

/**
 * Daxil olmus istifadecinin hansi restoranin hansi rolunda oldugunu tapir.
 * Sessiya yoxdursa /login-e yonlendirir. Hec bir restorana bagli deyilse
 * (nezeri olaraq bas vermemelidir, cunki onboard_restaurant avtomatik
 * elave edir) onboarding-e yonlendirir.
 *
 * QEYD: Hazirda istifadeci YALNIZ bir restorana sahib ola biler ssenarisi
 * ile qurulub (Faza 2 ehatesi). Sahibin bir necə restorani idare etmesi
 * (restaurant switcher) Faza 5+ - de elave olunacaq.
 */
export async function getCurrentStaffContext(): Promise<StaffContext> {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: staffRow }, { data: profile }] = await Promise.all([
    supabase
      .from("staff_members")
      .select("restaurant_id, role, restaurants(name)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  if (!staffRow) {
    redirect("/register");
  }

  return {
    userId: user.id,
    fullName: profile?.full_name ?? null,
    restaurantId: staffRow.restaurant_id,
    restaurantName: (staffRow.restaurants as unknown as { name: string })?.name ?? "",
    role: staffRow.role,
  };
}
