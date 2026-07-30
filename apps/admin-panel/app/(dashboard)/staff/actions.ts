"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { createSupabaseServiceClient } from "@restoran/supabase-client";
import { slugify } from "@restoran/utils";

async function requireOwner() {
  const context = await getCurrentStaffContext();
  if (context.role !== "owner") {
    throw new Error("FORBIDDEN: yalnız restoran sahibi işçiləri idarə edə bilər");
  }
  return context;
}

/**
 * Ofisiantin/kassirin/aspazin real hesabini DERHAL yaradir - e-poct
 * tesdiqi GOZLEMEDEN. Owner ad + sifre teyin edir, isci elə o an
 * daxil ola bilir. Bu, `SUPABASE_SERVICE_ROLE_KEY` teleb edir (yalniz
 * serverde, `auth.admin.createUser` RLS-i vә email tesdiqini bypass edir -
 * ona gore YALNIZ owner cagira biler, mütləq requireOwner() ile qorunur).
 */
export async function createStaffAccountAction(formData: FormData) {
  const { restaurantId } = await requireOwner();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");
  let email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!fullName || !role || password.length < 6) {
    redirect("/staff?error=" + encodeURIComponent("Ad, rol tələb olunur, şifrə ən azı 6 simvol olmalıdır"));
  }

  const serviceClient = createSupabaseServiceClient();

  if (!email) {
    // Qisa, yaddasaxlanan giris ucun: {ad}@{restoran-adi}.staff
    // (tesadufi herflersiz - "hesen@karvansaray.staff" kimi). Supabase
    // texniki olaraq email formati teleb edir, amma bu formatda YADDA
    // SAXLAMAQ ASANDIR. Toqquşma olarsa (eyni addan iki isci) 2, 3... elave edilir.
    const { data: restaurant } = await serviceClient.from("restaurants").select("name").eq("id", restaurantId).maybeSingle();
    const firstName = slugify(fullName.split(" ")[0] ?? fullName);
    const domain = slugify(restaurant?.name ?? "restoran");

    let candidate = `${firstName}@${domain}.staff`;
    let attempt = 1;
    while (attempt <= 5) {
      const { data: existing } = await serviceClient.auth.admin.listUsers();
      const taken = existing?.users?.some((u) => u.email?.toLowerCase() === candidate);
      if (!taken) break;
      attempt += 1;
      candidate = `${firstName}${attempt}@${domain}.staff`;
    }
    email = candidate;
  }

  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !created.user) {
    redirect(
      "/staff?error=" +
        encodeURIComponent(createError?.message.includes("already") ? "Bu e-poçt artıq istifadə olunur" : "Hesab yaradıla bilmədi")
    );
  }

  await serviceClient.from("staff_members").insert({
    user_id: created!.user!.id,
    restaurant_id: restaurantId,
    role: role as "manager" | "cashier" | "chef" | "waiter",
    is_active: true,
  });

  revalidatePath("/staff");
  redirect("/staff?created=" + encodeURIComponent(email));
}

export async function inviteStaffAction(formData: FormData) {
  const { restaurantId } = await requireOwner();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  if (!email || !role) return;

  const supabase = getSupabaseServerClient();
  await (
    supabase as unknown as { rpc: (fn: string, args: unknown) => Promise<{ error: unknown }> }
  ).rpc("invite_staff_member", { _restaurant_id: restaurantId, _email: email, _role: role });

  revalidatePath("/staff");
}

export async function updateStaffRoleAction(staffId: string, role: "owner" | "manager" | "cashier" | "chef" | "waiter" | "courier") {
  const { restaurantId } = await requireOwner();
  const supabase = getSupabaseServerClient();
  await supabase.from("staff_members").update({ role }).eq("id", staffId).eq("restaurant_id", restaurantId);
  revalidatePath("/staff");
}

export async function toggleStaffActiveAction(staffId: string, nextValue: boolean) {
  const { restaurantId } = await requireOwner();
  const supabase = getSupabaseServerClient();
  await supabase.from("staff_members").update({ is_active: nextValue }).eq("id", staffId).eq("restaurant_id", restaurantId);
  revalidatePath("/staff");
}

export async function cancelInvitationAction(invitationId: string) {
  await requireOwner();
  const supabase = getSupabaseServerClient();
  await supabase.from("staff_invitations").delete().eq("id", invitationId);
  revalidatePath("/staff");
}

/**
 * Isciye maaş/elave haqq odenishini QEYD edir (expenses cedveline,
 * category=salary). Pul cixarilmasi hessas emeliyyat oldugu ucun
 * digər staff idareetme funksiyalari kimi YALNIZ owner (requireOwner).
 */
export async function payStaffSalaryAction(staffId: string, amount: number, description: string) {
  const { restaurantId } = await requireOwner();
  if (!amount || amount <= 0) return;

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("expenses").insert({
    restaurant_id: restaurantId,
    category: "salary",
    amount,
    description: description.trim() || null,
    staff_member_id: staffId,
    expense_date: new Date().toISOString().slice(0, 10),
    created_by: user?.id ?? null,
  });

  revalidatePath("/staff");
  revalidatePath("/reports");
}
