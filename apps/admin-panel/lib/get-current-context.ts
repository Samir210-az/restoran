import { getServerSupabase } from "./supabase-server";

export interface CurrentContext {
  userId: string;
  fullName: string | null;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
  } | null;
  role: string | null;
}

/**
 * Dashboard-in tum sehifelerinin ehtiyaci olan minimum kontekst:
 * kim daxil olub, hansi restorana aiddir, hansi roldadir.
 * Bu, hər dashboard sehifesinde ayri-ayri sorgu yazmaqdansa TEK yerden gelir.
 */
export async function getCurrentContext(): Promise<CurrentContext | null> {
  const supabase = getServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: staffRow } = await supabase
    .from("staff_members")
    .select("role, restaurant_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  let restaurant: CurrentContext["restaurant"] = null;
  if (staffRow?.restaurant_id) {
    const { data: restaurantRow } = await supabase
      .from("restaurants")
      .select("id, name, slug, subscription_plan, subscription_status")
      .eq("id", staffRow.restaurant_id)
      .maybeSingle();

    if (restaurantRow) {
      restaurant = {
        id: restaurantRow.id,
        name: restaurantRow.name,
        slug: restaurantRow.slug,
        subscriptionPlan: restaurantRow.subscription_plan,
        subscriptionStatus: restaurantRow.subscription_status,
      };
    }
  }

  return {
    userId: user.id,
    fullName: profile?.full_name ?? null,
    restaurant,
    role: staffRow?.role ?? null,
  };
}
