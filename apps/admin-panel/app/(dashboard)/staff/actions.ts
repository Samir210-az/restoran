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

  if (!email) {
    const suffix = Math.random().toString(36).slice(2, 6);
    email = `${slugify(fullName)}-${suffix}@staff.restoran.local`;
  }

  const serviceClient = createSupabaseServiceClient();

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

export async function updateStaffRoleAction(staffId: string, role: "owner" | "manager" | "cashier" | "chef" | "waiter") {
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
