"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requirePlatformAdmin } from "@/lib/get-current-platform-admin";
import { createSupabaseServiceClient } from "@restoran/supabase-client";
import { slugifyUnique } from "@restoran/utils";

export async function setRestaurantStatusAction(restaurantId: string, status: string) {
  await requirePlatformAdmin();
  const supabase = getSupabaseServerClient();
  await (
    supabase as unknown as { rpc: (fn: string, args: unknown) => Promise<{ error: unknown }> }
  ).rpc("set_restaurant_subscription_status", { _restaurant_id: restaurantId, _status: status });
  revalidatePath("/platform");
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

  await serviceClient.from("branches").insert({ restaurant_id: restaurantId, name: restaurantName, is_active: true });

  await serviceClient.from("staff_members").insert({
    user_id: ownerId,
    restaurant_id: restaurantId,
    role: "owner",
    is_active: true,
  });

  revalidatePath("/platform");
  redirect("/platform?rcreated=" + encodeURIComponent(`${restaurantName} (giriş: ${ownerEmail})`));
}
