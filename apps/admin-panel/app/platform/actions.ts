"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requirePlatformAdmin } from "@/lib/get-current-platform-admin";
import { createSupabaseServiceClient } from "@restoran/supabase-client";
import { slugifyUnique, generateAccessCode } from "@restoran/utils";

export async function regenerateAccessCodeAction(restaurantId: string) {
  await requirePlatformAdmin();
  const serviceClient = createSupabaseServiceClient();
  const accessCode = generateAccessCode();
  await (
    serviceClient as unknown as { rpc: (fn: string, args: unknown) => Promise<{ error: unknown }> }
  ).rpc("set_restaurant_access_code", { _restaurant_id: restaurantId, _code: accessCode });
  revalidatePath(`/platform/${restaurantId}`);
  redirect(`/platform/${restaurantId}?rcode=` + encodeURIComponent(accessCode));
}

export async function setRestaurantStatusAction(restaurantId: string, status: string) {
  await requirePlatformAdmin();
  const supabase = getSupabaseServerClient();
  await (
    supabase as unknown as { rpc: (fn: string, args: unknown) => Promise<{ error: unknown }> }
  ).rpc("set_restaurant_subscription_status", { _restaurant_id: restaurantId, _status: status });
  revalidatePath("/platform", "layout");
}

/**
 * Samir (platform admin) musteri ile razilasandan sonra birbasa yeni
 * restoran + sahib hesabi yaradir - hec bir e-poct tesdiqi/self-signup
 * axini olmadan. `onboard_restaurant` RPC-si BURADA ISTIFADE OLUNMUR,
 * cunki o auth.uid()-e esaslanir ve service-role kontekstinde (auth.uid()
 * null olur) ise bilmez. Ona gore restaurants/branches/staff_members
 * setirleri service client ile EL ILE, `createStaffAccountAction`-daki
 * eyni prinsiple (auth.admin.createUser + email_confirm: true) yaradilir.
 */
export async function createRestaurantWithOwnerAction(formData: FormData) {
  await requirePlatformAdmin();

  const restaurantName = String(formData.get("restaurant_name") ?? "").trim();
  const ownerFullName = String(formData.get("owner_full_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  let ownerEmail = String(formData.get("owner_email") ?? "").trim().toLowerCase();

  if (!restaurantName || !ownerFullName || password.length < 6) {
    redirect(
      "/platform?rerror=" + encodeURIComponent("Restoran adı, sahibin adı tələb olunur, şifrə ən azı 6 simvol olmalıdır")
    );
  }

  const serviceClient = createSupabaseServiceClient();
  const slug = slugifyUnique(restaurantName);

  if (!ownerEmail) {
    // Isci hesablarindaki eyni qaydaya uygun: {ad}@{restoran-slug-domeni}.staff
    const firstName = ownerFullName.split(" ")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "sahib";
    const domain = slug.replace(/-[a-z0-9]{4}$/, "");

    let candidate = `${firstName}@${domain}.staff`;
    let attempt = 1;
    while (attempt <= 5) {
      const { data: existing } = await serviceClient.auth.admin.listUsers();
      const taken = existing?.users?.some((u) => u.email?.toLowerCase() === candidate);
      if (!taken) break;
      attempt += 1;
      candidate = `${firstName}${attempt}@${domain}.staff`;
    }
    ownerEmail = candidate;
  }

  // TEHLUKESIZLIK YOXLAMASI (bug duzelisi): evvelce bura hec bir
  // yoxlama olmadan gedirdi - eger daxil edilen e-poçt ARTIQ mövcud
  // bir hesaba (xususen PLATFORM ADMIN-e) aid idise, Supabase Auth
  // bezen xeta vermek evezine mövcud istifadəçini geri qaytara bilir -
  // netice: platform admin (Samir) ozu bilmeden yeni restoranın
  // "owner" staff sətrini alirdi ve giriş edende ora atilirdi (bax:
  // SAD - platform admin restoran-scoped stafften TAM ayrı olmalıdır).
  // Indi: email mövcuddursa YARADILMIR, aydın xeta gosterilir.
  const { data: existingUsers } = await serviceClient.auth.admin.listUsers();
  const alreadyExists = existingUsers?.users?.find((u) => u.email?.toLowerCase() === ownerEmail);
  if (alreadyExists) {
    const { data: isExistingPlatformAdmin } = await serviceClient
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", alreadyExists.id)
      .maybeSingle();
    redirect(
      "/platform?rerror=" +
        encodeURIComponent(
          isExistingPlatformAdmin
            ? "Bu e-poçt platform admin hesabına aiddir - restoran sahibi kimi istifadə edilə bilməz"
            : "Bu e-poçt artıq istifadə olunur - fərqli e-poçt seçin, ya da boş buraxıb avtomatik yaratdırın"
        )
    );
  }

  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email: ownerEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: ownerFullName },
  });

  if (createError || !created.user) {
    redirect(
      "/platform?rerror=" +
        encodeURIComponent(createError?.message.includes("already") ? "Bu e-poçt artıq istifadə olunur" : "Sahib hesabı yaradıla bilmədi")
    );
  }

  const ownerId = created!.user!.id;

  // Ehtiyat qat: yuxarıdaki yoxlamadan hər hansı sebeble kecse belə,
  // yaradilan hesab platform admin-e aiddirse (nezeri hal), burada
  // dayandırırıq - restoran/staff setri YARADILMIR.
  const { data: ownerIsPlatformAdmin } = await serviceClient
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", ownerId)
    .maybeSingle();
  if (ownerIsPlatformAdmin) {
    redirect(
      "/platform?rerror=" + encodeURIComponent("Bu e-poçt platform admin hesabına aiddir - restoran sahibi kimi istifadə edilə bilməz")
    );
  }

  const { data: newRestaurant, error: restaurantError } = await serviceClient
    .from("restaurants")
    .insert({ owner_id: ownerId, name: restaurantName, slug })
    .select("id")
    .single();

  if (restaurantError || !newRestaurant) {
    // Restoran setri yaradila bilmedi - yetim (orphan) auth hesabini geri temizle
    await serviceClient.auth.admin.deleteUser(ownerId);
    redirect("/platform?rerror=" + encodeURIComponent("Restoran yaradıla bilmədi: " + (restaurantError?.message ?? "naməlum xəta")));
  }

  const restaurantId = newRestaurant.id;

  // Loqo (isteye bagli) - restoran yaradilan KIMI elave olunsun deye.
  // serviceClient (service_role) istifade olunur - storage RLS-i
  // (owner_id=auth.uid() yoxlamasi) bypass edir, ona gore bu, platform
  // admin-in OZ sessiyasindan asili olmadan islek olur.
  const logoFile = formData.get("logo");
  const ALLOWED_LOGO_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
  if (logoFile instanceof File && logoFile.size > 0 && logoFile.size <= 2 * 1024 * 1024) {
    const ext = ALLOWED_LOGO_TYPES[logoFile.type];
    if (ext) {
      const path = `${restaurantId}/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await serviceClient.storage
        .from("restaurant-logos")
        .upload(path, logoFile, { contentType: logoFile.type, upsert: false });
      if (!uploadError) {
        const { data: publicUrlData } = serviceClient.storage.from("restaurant-logos").getPublicUrl(path);
        await serviceClient.from("restaurants").update({ logo_url: publicUrlData.publicUrl }).eq("id", restaurantId);
      }
    }
  }

  await serviceClient.from("branches").insert({ restaurant_id: restaurantId, name: restaurantName, is_active: true });

  await serviceClient.from("staff_members").insert({
    user_id: ownerId,
    restaurant_id: restaurantId,
    role: "owner",
    is_active: true,
  });

  // Cihaz-giris kodu (bax: RestaurantPicker "ad+kod" ekrani) - burada
  // yaradilib BIR DEFE ugur mesajinda gosterilir, cunki hash-lendikden
  // sonra bir daha DUZ METN kimi geri oxuna bilmez. Sahib bunu
  // /settings-den istediyi zaman yenileye biler.
  const accessCode = generateAccessCode();
  const { error: rpcError } = await (
    serviceClient as unknown as { rpc: (fn: string, args: unknown) => Promise<{ error: unknown }> }
  ).rpc("set_restaurant_access_code", { _restaurant_id: restaurantId, _code: accessCode });
  if (rpcError) {
    // Kodu tesis etmek alinmasa da, restoran ozu artiq yaradilib -
    // sahib /settings-den sonradan tesis ede biler, prosesi dayandirmiriq.
  }

  revalidatePath("/platform");
  redirect(
    "/platform?rcreated=" +
      encodeURIComponent(`${restaurantName} — giriş: ${ownerEmail} / PIN: ${password} — Restoran kodu: ${accessCode}`)
  );
}

/**
 * Restoranin SAHIBLIYINI baska bir sexse otur.
 *
 * KOK SEBEB (bax: SAD tehlukesizlik bolmesi): restaurants.owner_id
 * YALNIZ yaradilan anda tesis olunurdu ve sonradan HEC BIR yerde
 * yenilenmirdi - hetta staff_members-de kimise "owner" rolu verilse
 * belə. Bu, iki problem yaradirdi: (1) Platform panelinde "Sahib"
 * kartinda HEMISE ilk yaradan sexs gorunurdu, (2) restaurants UPDATE
 * RLS policy-si (owner_id=auth.uid()) kohne sahibden basqa hec kimin
 * /settings-i yadda saxlamasina icaze vermirdi (sukutla 0 setir
 * yenilenirdi, error de gorunmurdu). RLS policy ve get_platform_overview
 * artiq staff_members.role='owner'-i TEK heqiqet menbeyi kimi
 * istifade edir (bax: fix_owner_permission_source_of_truth migrasiyasi) -
 * bu funksiya da eyni prinsiple YENI sahibi tesis edir VE kohne
 * sahib(ler)i "manager"-e endirir (tam kilidlemir - staff girisi qalir,
 * sadece "owner" hüquqlari goturulur), owner_id sutununu da (legacy/
 * ehtiyat ucun) sinxronlashdirir.
 */
export async function transferRestaurantOwnerAction(formData: FormData) {
  await requirePlatformAdmin();

  const restaurantId = String(formData.get("restaurant_id") ?? "");
  const ownerFullName = String(formData.get("new_owner_full_name") ?? "").trim();
  const password = String(formData.get("new_owner_password") ?? "");
  const ownerEmail = String(formData.get("new_owner_email") ?? "").trim().toLowerCase();

  if (!restaurantId || !ownerEmail) {
    redirect(`/platform/${restaurantId}?rerror=` + encodeURIComponent("Yeni sahibin e-poçtu tələb olunur"));
  }

  const serviceClient = createSupabaseServiceClient();

  const { data: existingUsers } = await serviceClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email?.toLowerCase() === ownerEmail);

  let newOwnerId: string;

  if (existingUser) {
    // Platform admin restoran-scoped stafften TAM ayrı olmalıdır (bax:
    // SAD) - ona görə platform admin hesabı yeni "sahib" kimi TƏYİN
    // OLUNA BİLMƏZ.
    const { data: targetIsPlatformAdmin } = await serviceClient
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", existingUser.id)
      .maybeSingle();
    if (targetIsPlatformAdmin) {
      redirect(
        `/platform/${restaurantId}?rerror=` +
          encodeURIComponent("Bu e-poçt platform admin hesabına aiddir - restoran sahibi kimi təyin edilə bilməz")
      );
    }

    // Bu e-poctla artiq hesab var - ancaq platformada YALNIZ bir
    // restorana bagli ola bilme qaydasina (bax: get-current-staff-context)
    // hormet etmek ucun, bu sexsin BASQA restoranda aktiv staff sətri
    // olmamalidir (bu restoranda olmasi problem deyil - sadece rolu
    // deyisdirilecek).
    const { data: otherStaffRow } = await serviceClient
      .from("staff_members")
      .select("id, restaurant_id")
      .eq("user_id", existingUser.id)
      .eq("is_active", true)
      .neq("restaurant_id", restaurantId)
      .maybeSingle();

    if (otherStaffRow) {
      redirect(
        `/platform/${restaurantId}?rerror=` +
          encodeURIComponent("Bu e-poçt artıq başqa bir restoranın işçisidir - hazırda bir istifadəçi yalnız bir restorana bağlı ola bilər")
      );
    }

    newOwnerId = existingUser.id;

    const { data: sameRestaurantRow } = await serviceClient
      .from("staff_members")
      .select("id")
      .eq("user_id", newOwnerId)
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (sameRestaurantRow) {
      await serviceClient
        .from("staff_members")
        .update({ role: "owner", is_active: true })
        .eq("id", sameRestaurantRow.id);
    } else {
      await serviceClient
        .from("staff_members")
        .insert({ user_id: newOwnerId, restaurant_id: restaurantId, role: "owner", is_active: true });
    }
  } else {
    if (!ownerFullName || password.length < 6) {
      redirect(
        `/platform/${restaurantId}?rerror=` +
          encodeURIComponent("Bu e-poçtla hesab yoxdur - yeni hesab yaratmaq üçün ad və ən azı 6 simvollu şifrə lazımdır")
      );
    }

    const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
      email: ownerEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: ownerFullName },
    });

    if (createError || !created.user) {
      redirect(
        `/platform/${restaurantId}?rerror=` +
          encodeURIComponent("Yeni sahib hesabı yaradıla bilmədi: " + (createError?.message ?? "naməlum xəta"))
      );
    }

    newOwnerId = created!.user!.id;
    await serviceClient
      .from("staff_members")
      .insert({ user_id: newOwnerId, restaurant_id: restaurantId, role: "owner", is_active: true });
  }

  // Kohne sahib(ler)i teyin et: eger platform admin-dirse (bax: SAD -
  // platform admin restoran-scoped stafften TAMAM ayri olmalidir),
  // staff setrini TAM deaktiv edirik ki, "Öz panelimə qayıt" kimi
  // linkler onu artiq sahiblik etmediyi restorana aparmasin. Adi
  // (platform admin olmayan) kohne sahib ucun ise "manager"-e endirmek
  // kifayetdir - o hele bu restoranin biznesinde ise davam ede biler.
  const { data: oldOwnerRows } = await serviceClient
    .from("staff_members")
    .select("id, user_id")
    .eq("restaurant_id", restaurantId)
    .eq("role", "owner")
    .neq("user_id", newOwnerId);

  for (const row of oldOwnerRows ?? []) {
    const { data: isOldOwnerPlatformAdmin } = await serviceClient
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", row.user_id)
      .maybeSingle();

    await serviceClient
      .from("staff_members")
      .update(isOldOwnerPlatformAdmin ? { is_active: false } : { role: "manager" })
      .eq("id", row.id);
  }

  // Legacy/ehtiyat sutunu sinxronlashdir.
  await serviceClient.from("restaurants").update({ owner_id: newOwnerId }).eq("id", restaurantId);

  revalidatePath("/platform", "layout");
  revalidatePath("/dashboard", "layout");
  redirect(`/platform/${restaurantId}?rowner=` + encodeURIComponent(ownerEmail));
}

/**
 * Restoranin BUTUN test/emeliyyat melumatlarini (sifarisler,
 * rezervasiyalar, musteriler, xercler ve s.) sildirir, qurulusu
 * (menyu, isciler, masalar, brendinq) SAXLAYIR. YALNIZ platform admin
 * (requirePlatformAdmin) cagira biler - restoran sahibi/menecerin bu
 * emeliyyata hec bir yolu yoxdur (heç bir UI-de teklif olunmur, RPC-nin
 * ozu de is_platform_admin() yoxlayir - iki qatli qoruma).
 */
export async function resetRestaurantDataAction(restaurantId: string, confirmName: string, expectedName: string) {
  await requirePlatformAdmin();

  if (confirmName.trim().toLowerCase() !== expectedName.trim().toLowerCase()) {
    redirect(`/platform/${restaurantId}?rerror=` + encodeURIComponent("Restoran adı düzgün yazılmadı, sıfırlama ləğv edildi"));
  }

  const supabase = getSupabaseServerClient();
  const { error } = await (
    supabase as unknown as { rpc: (fn: string, args: unknown) => Promise<{ error: { message: string } | null }> }
  ).rpc("platform_reset_restaurant_data", { _restaurant_id: restaurantId });

  if (error) {
    redirect(`/platform/${restaurantId}?rerror=` + encodeURIComponent("Sıfırlama uğursuz oldu: " + error.message));
  }

  revalidatePath("/platform", "layout");
  redirect(`/platform/${restaurantId}?rreset=` + encodeURIComponent(expectedName));
}

/**
 * HƏMİŞƏLİK silmə - restoranin OZUNU (menyu, isciler, masalar,
 * brendinq DAXIL, HAMISI) silir. "Sıfırla"-dan (yalniz test/emeliyyat
 * melumatlari) tamamile ferqli - bu QAYIDILMAZDIR. Emeliyyatdan sonra
 * restoran artiq movcud olmadigi ucun ana siyahiya (/platform) qayidir.
 */
export async function deleteRestaurantAction(restaurantId: string, confirmName: string, expectedName: string) {
  await requirePlatformAdmin();

  if (confirmName.trim().toLowerCase() !== expectedName.trim().toLowerCase()) {
    redirect(`/platform/${restaurantId}?rerror=` + encodeURIComponent("Restoran adı düzgün yazılmadı, silmə ləğv edildi"));
  }

  const supabase = getSupabaseServerClient();
  const { error } = await (
    supabase as unknown as { rpc: (fn: string, args: unknown) => Promise<{ error: { message: string } | null }> }
  ).rpc("platform_delete_restaurant", { _restaurant_id: restaurantId });

  if (error) {
    redirect(`/platform/${restaurantId}?rerror=` + encodeURIComponent("Silmə uğursuz oldu: " + error.message));
  }

  revalidatePath("/platform", "layout");
  redirect("/platform?rdeleted=" + encodeURIComponent(expectedName));
}
