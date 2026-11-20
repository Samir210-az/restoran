import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function getRestaurantTimeZone(restaurantId: string) {
  const { data } = await getSupabaseServerClient().from("restaurants").select("timezone").eq("id", restaurantId).maybeSingle();
  return data?.timezone || "Asia/Baku";
}
