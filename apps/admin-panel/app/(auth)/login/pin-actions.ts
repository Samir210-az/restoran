"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabasePublicClient, createSupabaseServiceClient } from "@restoran/supabase-client";

const DEVICE_COOKIE = "device_restaurant_slug";
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~400 gün - brauzerlərin icazə verdiyi maksimum

/**
 * Bu cihazi (planşet/kassa kompüteri) BİR restorana bağlayır - "ad +
 * gizli kod" ilə (Samir-in qərarı: ictimai siyahıdan seçim YOX, çünki
 * bu, bütün restoranların adlarını hər kəsə açar - ad+kod daha
 * təhlükəsizdir). Kod `verify_restaurant_access` SECURITY DEFINER
 * RPC-si ilə yoxlanılır (bax: migrasiya) - ad və ya kod yanlışdırsa
 * eyni ümumi xəta göstərilir (hansının səhv olduğunu bildirmir).
 */
export async function selectDeviceRestaurantAction(formData: FormData) {
  const name = String(formData.get("restaurant_name") ?? "").trim();
  const code = String(formData.get("restaurant_code") ?? "").trim();

  if (!name || !code) {
    redirect("/login?error=" + encodeURIComponent("Restoran adı və kodu tələb olunur"));
  }

  const supabase = createSupabasePublicClient();
  const { data } = await (
    supabase as unknown as {
      rpc: (fn: string, args: unknown) => Promise<{ data: LoginDirectoryRestaurant[] | null }>;
    }
  ).rpc("verify_restaurant_access", { _name: name, _code: code });

  const match = data?.[0];
  if (!match) {
    redirect("/login?error=" + encodeURIComponent("Restoran adı və ya kod yanlışdır"));
  }

  cookies().set(DEVICE_COOKIE, match!.slug, {
    maxAge: DEVICE_COOKIE_MAX_AGE,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/login");
}

/** Səhv restoran seçilibsə, cihazı sıfırlamaq üçün (nadir hal). */
export async function clearDeviceRestaurantAction() {
  cookies().delete(DEVICE_COOKIE);
  redirect("/login");
}

/**
 * Ad+PIN girişi: istifadəçi email YAZMIR - sadəcə öz adını (kart)
 * seçir və qısa PIN yazır. Arxada bu, hələ də normal Supabase Auth
 * email+şifrə axınıdır (email avtomatik yaradılıb, istifadəçiyə heç
 * göstərilmir belə) - service-role client YALNIZ email-i tapmaq üçün
 * istifadə olunur, faktiki giriş (sessiya/cookie) normal
 * signInWithPassword ilə, adi server client-lə aparılır.
 */
export async function staffPinLoginAction(formData: FormData) {
  const staffId = String(formData.get("staff_id") ?? "");
  const pin = String(formData.get("pin") ?? "");
  const restaurantId = String(formData.get("restaurant_id") ?? "");

  if (!staffId || !pin || !restaurantId) {
    redirect("/login?error=" + encodeURIComponent("PIN daxil edin"));
  }

  const serviceClient = createSupabaseServiceClient();

  const { data: staffRow } = await serviceClient
    .from("staff_members")
    .select("id, user_id, restaurant_id")
    .eq("id", staffId)
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .maybeSingle();

  if (!staffRow) {
    redirect("/login?error=" + encodeURIComponent("İşçi tapılmadı"));
  }

  const { data: userData, error: userError } = await serviceClient.auth.admin.getUserById(staffRow!.user_id);
  if (userError || !userData.user?.email) {
    redirect("/login?error=" + encodeURIComponent("Hesab tapılmadı, platforma ilə əlaqə saxlayın"));
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: userData!.user!.email!, password: pin });

  if (error) {
    redirect("/login?error=" + encodeURIComponent("PIN yanlışdır"));
  }

  redirect("/dashboard");
}

export interface LoginDirectoryRestaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  theme_color: string;
}

export interface StaffLoginName {
  staff_id: string;
  full_name: string;
  role: string;
}

export async function getDeviceRestaurantSlug(): Promise<string | null> {
  return cookies().get(DEVICE_COOKIE)?.value ?? null;
}

/** Cihaza bağlı restoranın (id/ad/loqo) məlumatını gətirir. */
export async function getBoundRestaurant(slug: string): Promise<LoginDirectoryRestaurant | null> {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase.rpc("get_public_restaurant_by_slug", { _slug: slug });
  const row = data?.[0];
  if (!row) return null;
  return { id: row.id, name: row.name, slug: row.slug, logo_url: row.logo_url, theme_color: row.theme_color };
}

/** Seçilmiş restoranın aktiv işçilərinin adlarını (email YOX) gətirir. */
export async function getStaffLoginNames(restaurantId: string): Promise<StaffLoginName[]> {
  const supabase = createSupabasePublicClient();
  const { data } = await (
    supabase as unknown as { rpc: (fn: string, args: unknown) => Promise<{ data: StaffLoginName[] | null }> }
  ).rpc("get_staff_login_names", { _restaurant_id: restaurantId });
  return data ?? [];
}
