"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/**
 * Restoranin musteri-uzlu brendinqini (loqo + tema rengi) yeniler.
 * YALNIZ owner - branding heseabin butun musteri sehifelerine (ana
 * sehife directory-si + [slug] menyu sehifesi) tesir etdiyi ucun
 * menecere qoyulmur (staff/actions.ts-deki eyni requireOwner prinsipi).
 *
 * Logo faylı bu action-un OZUNDE Supabase Storage-a yuklenir (server
 * terefinde, istifadecinin sessiyasi ile - RLS storage policy-leri
 * `restaurant-logos` bucket-inde YALNIZ oz restoraninin qovlugna
 * yazmasina icaze verir, bax: migrasiya).
 */
export async function updateRestaurantBrandingAction(formData: FormData) {
  const context = await getCurrentStaffContext();

  if (context.role !== "owner") {
    redirect("/settings?error=" + encodeURIComponent("Brendinqi yalnız restoran sahibi dəyişə bilər"));
  }

  const themeColor = String(formData.get("theme_color") ?? "").trim();
  if (!HEX_COLOR_PATTERN.test(themeColor)) {
    redirect("/settings?error=" + encodeURIComponent("Rəng düzgün HEX formatında deyil"));
  }

  const supabase = getSupabaseServerClient();
  const updates: { theme_color: string; logo_url?: string } = { theme_color: themeColor };

  const logoFile = formData.get("logo");
  if (logoFile instanceof File && logoFile.size > 0) {
    const ext = ALLOWED_LOGO_TYPES[logoFile.type];
    if (!ext) {
      redirect("/settings?error=" + encodeURIComponent("Loqo yalnız PNG, JPEG və ya WEBP formatında ola bilər"));
    }
    if (logoFile.size > MAX_LOGO_BYTES) {
      redirect("/settings?error=" + encodeURIComponent("Loqo faylı 2MB-dan böyük ola bilməz"));
    }

    const path = `${context.restaurantId}/logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("restaurant-logos")
      .upload(path, logoFile, { contentType: logoFile.type, upsert: false });

    if (uploadError) {
      redirect("/settings?error=" + encodeURIComponent("Loqo yüklənə bilmədi: " + uploadError.message));
    }

    const { data: publicUrlData } = supabase.storage.from("restaurant-logos").getPublicUrl(path);
    updates.logo_url = publicUrlData.publicUrl;
  }

  const { error: updateError } = await supabase.from("restaurants").update(updates).eq("id", context.restaurantId);

  if (updateError) {
    redirect("/settings?error=" + encodeURIComponent("Yadda saxlanıla bilmədi, yenidən cəhd edin"));
  }

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}
