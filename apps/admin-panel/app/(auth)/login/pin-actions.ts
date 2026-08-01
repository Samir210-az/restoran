"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabasePublicClient, createSupabaseServiceClient } from "@restoran/supabase-client";

const DEVICE_COOKIE = "device_restaurant_slug";
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~400 gün - brauzerlərin icazə verdiyi maksimum

/**
 * Bu cihazi (planşet/kassa kompüteri) BİR restorana bağlayır - Samir-in
 * qərarı: hər restoranın öz ayrıca cihazı olacaq, cihaz həmişə eyni
 * restoranda qalacaq. Bir dəfə seçiləndən sonra bir daha restoran
 * seçmə ekranı görünmür, birbaşa "kim daxil olur" (ad+PIN) ekranına keçir.
 */
export async function selectDeviceRestaurantAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) redirect("/login");

  cookies().set(DEVICE_COOKIE, slug, {
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
  const { data } = await supabase.rpc("get_public_restaurant_directory");
  return ((data ?? []) as LoginDirectoryRestaurant[]).find((r) => r.slug === slug) ?? null;
}

export async function getRestaurantDirectory(): Promise<LoginDirectoryRestaurant[]> {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase.rpc("get_public_restaurant_directory");
  return (data ?? []) as LoginDirectoryRestaurant[];
}

/** Seçilmiş restoranın aktiv işçilərinin adlarını (email YOX) gətirir. */
export async function getStaffLoginNames(restaurantId: string): Promise<StaffLoginName[]> {
  const supabase = createSupabasePublicClient();
  const { data } = await (
    supabase as unknown as { rpc: (fn: string, args: unknown) => Promise<{ data: StaffLoginName[] | null }> }
  ).rpc("get_staff_login_names", { _restaurant_id: restaurantId });
  return data ?? [];
}
