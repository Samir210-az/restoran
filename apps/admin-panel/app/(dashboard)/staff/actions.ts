"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";

async function requireOwner() {
  const context = await getCurrentStaffContext();
  if (context.role !== "owner") {
    throw new Error("FORBIDDEN: yalnız restoran sahibi işçiləri idarə edə bilər");
  }
  return context;
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
