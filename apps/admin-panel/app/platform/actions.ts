"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requirePlatformAdmin } from "@/lib/get-current-platform-admin";

export async function setRestaurantStatusAction(restaurantId: string, status: string) {
  await requirePlatformAdmin();
  const supabase = getSupabaseServerClient();
  await (
    supabase as unknown as { rpc: (fn: string, args: unknown) => Promise<{ error: unknown }> }
  ).rpc("set_restaurant_subscription_status", { _restaurant_id: restaurantId, _status: status });
  revalidatePath("/platform");
}
