"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceClient } from "@restoran/supabase-client";
import { generateAccessCode } from "@restoran/utils";

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/**
 * Restoranin cihaz-giris kodunu (bax: RestaurantPicker "ad+kod")
 * yeniləyir - YALNIZ owner. Kod set_restaurant_access_code RPC-si
 * ilə hash-lənərək saxlanılır, `regenerateAccessCodeAction`-un
 * platform admin versiyası ilə EYNİ prinsip (bax: platform/actions.ts).
 */
export async function regenerateOwnAccessCodeAction() {
  const context = await getCurrentStaffContext();
  if (context.role !== "owner") {
    redirect("/settings?error=" + encodeURIComponent("Kodu yalnız restoran sahibi yeniləyə bilər"));
  }

  const serviceClient = createSupabaseServiceClient();
  const accessCode = generateAccessCode();
  await (
    serviceClient as unknown as { rpc: (fn: string, args: unknown) => Promise<{ error: unknown }> }
  ).rpc("set_restaurant_access_code", { _restaurant_id: context.restaurantId, _code: accessCode });

  revalidatePath("/settings");
  redirect("/settings?code=" + encodeURIComponent(accessCode));
}

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

/**
 * Restoranin OZ Payriff hesabinin acarlarini saxlayir. Bu acarlar
 * musteri odeyende ISTIFADE OLUNACAQ ki, pul BIRBASA restoranin oz
 * Payriff hesabina dussun - platforma (biz) pulun ustunden kecmir.
 *
 * secret_key HEC VAXT geri oxunmur (restaurant_payment_settings-de
 * SELECT policy yoxdur) - bu action YAZIR, `get_payment_settings_status`
 * RPC-si isə YALNIZ maskalanmiş statusu (var/yox) qaytarir.
 */
export async function updatePaymentSettingsAction(formData: FormData) {
  const context = await getCurrentStaffContext();

  if (context.role !== "owner") {
    redirect("/settings?error=" + encodeURIComponent("Ödəniş parametrlərini yalnız restoran sahibi dəyişə bilər"));
  }

  const merchantId = String(formData.get("merchant_id") ?? "").trim();
  const secretKeyInput = String(formData.get("secret_key") ?? "").trim();
  const isActive = formData.get("is_active") === "on";

  if (isActive && (!merchantId || !secretKeyInput)) {
    redirect("/settings?error=" + encodeURIComponent("Aktiv etmək üçün Merchant ID və Secret Key tələb olunur"));
  }

  const supabase = getSupabaseServerClient();

  const updates: { merchant_id: string; is_active: boolean; provider: string; secret_key?: string } = {
    merchant_id: merchantId,
    is_active: isActive,
    provider: "payriff",
  };
  // Sahib secret key sahesini bos buraxsa (evvelceden saxlanmis deyeri
  // deyismek istemirse), movcud deyeri EZMIRIK - yalniz yeni deyer
  // yazilanda update edirik.
  if (secretKeyInput) {
    updates.secret_key = secretKeyInput;
  }

  const { error } = await supabase
    .from("restaurant_payment_settings")
    .upsert({ restaurant_id: context.restaurantId, ...updates }, { onConflict: "restaurant_id" });

  if (error) {
    redirect("/settings?error=" + encodeURIComponent("Ödəniş parametrləri yadda saxlanıla bilmədi"));
  }

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

/**
 * Kartdan-karta (elle) odenis ucun restoranin bank karti melumatlarini
 * saxlayir. Bu, Payriff-den ferqli olaraq HEC bir API teleb etmir -
 * musteri sadece bu kart nomresine oz bank tetbiqi ile kocurme edir,
 * kassir sonra "Ödəniş alındı" duymesi ile tesdiqleyir (bax: orders/actions.ts).
 */
export async function updateCardTransferAction(formData: FormData) {
  const context = await getCurrentStaffContext();

  if (context.role !== "owner") {
    redirect("/settings?error=" + encodeURIComponent("Ödəniş parametrlərini yalnız restoran sahibi dəyişə bilər"));
  }

  const cardNumberRaw = String(formData.get("card_number") ?? "").replace(/\s+/g, "");
  const cardHolderName = String(formData.get("card_holder_name") ?? "").trim();
  const bankName = String(formData.get("bank_name") ?? "").trim();
  const isActive = formData.get("card_is_active") === "on";

  if (cardNumberRaw && !/^\d{16}$/.test(cardNumberRaw)) {
    redirect("/settings?error=" + encodeURIComponent("Kart nömrəsi 16 rəqəmdən ibarət olmalıdır"));
  }
  if (isActive && !cardNumberRaw) {
    redirect("/settings?error=" + encodeURIComponent("Aktiv etmək üçün kart nömrəsi tələb olunur"));
  }

  // Oxunaqli formatda saxlayiriq: "XXXX XXXX XXXX XXXX"
  const formattedCardNumber = cardNumberRaw ? cardNumberRaw.match(/.{1,4}/g)?.join(" ") ?? cardNumberRaw : "";

  const supabase = getSupabaseServerClient();
  const { error: cardError } = await supabase.from("restaurant_card_transfer").upsert(
    {
      restaurant_id: context.restaurantId,
      card_number: formattedCardNumber || null,
      card_holder_name: cardHolderName || null,
      bank_name: bankName || null,
      is_active: isActive,
    },
    { onConflict: "restaurant_id" }
  );

  if (cardError) {
    redirect("/settings?error=" + encodeURIComponent("Kart məlumatları yadda saxlanıla bilmədi"));
  }

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}
