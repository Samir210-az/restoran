import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "./supabase-server";

export interface StaffContext {
  userId: string;
  staffId: string;
  fullName: string | null;
  restaurantId: string;
  restaurantName: string;
  role: "owner" | "manager" | "cashier" | "chef" | "waiter" | "courier";
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

  // Gozleyen deveti(leri) varsa, burada sessiz sekilde qebul edilir -
  // bu, "isciler" sehifesinde davet olunan bir sexs sonradan qeydiyyatdan
  // kecende avtomatik dogru restorana qosulmasini temin edir.
  await (supabase as unknown as { rpc: (fn: string, args?: unknown) => Promise<unknown> }).rpc(
    "accept_pending_invitations"
  );

  const [{ data: staffRow }, { data: profile }] = await Promise.all([
    supabase
      .from("staff_members")
      .select("id, restaurant_id, role, restaurants(name, subscription_status)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  if (!staffRow) {
    redirect("/onboarding");
  }

  const restaurantInfo = staffRow.restaurants as unknown as { name: string; subscription_status: string } | null;

  // Restoranin abuneliyi dayandirilib/legv edilibse - giris bloklanir.
  // Platform admin "Dayandır" basanda bu, YALNIZ musteri terefini
  // (get_public_restaurant_by_slug filtri) yox, ISCILƏRIN OZ panelini
  // de bloklamalidir - evvelki versiyada bu YOXLANMIRDI, isciler
  // dayandirilmis restoranda da tam funksionalliqla ise davam ede bilirdi.
  if (restaurantInfo?.subscription_status === "suspended" || restaurantInfo?.subscription_status === "cancelled") {
    redirect("/suspended");
  }

  return {
    userId: user.id,
    staffId: staffRow.id,
    fullName: profile?.full_name ?? null,
    restaurantId: staffRow.restaurant_id,
    restaurantName: restaurantInfo?.name ?? "",
    role: staffRow.role,
  };
}
