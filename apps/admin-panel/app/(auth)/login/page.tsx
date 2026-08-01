import { RoleLoginGate } from "@/components/auth/RoleLoginGate";
import { RestaurantPicker } from "@/components/auth/RestaurantPicker";
import { getDeviceRestaurantSlug, getBoundRestaurant } from "./pin-actions";

export const metadata = { title: "Daxil ol" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const slug = await getDeviceRestaurantSlug();
  const restaurant = slug ? await getBoundRestaurant(slug) : null;

  // Cihaz hələ heç bir restorana bağlanmayıb (ilk açılış) - ad+kod
  // ekranı göstərilir. Bir dəfə bağlandıqdan sonra bu ekran BİR DAHA
  // görünmür (bax: selectDeviceRestaurantAction).
  if (!restaurant) {
    return <RestaurantPicker error={searchParams.error} />;
  }

  return <RoleLoginGate restaurant={restaurant} error={searchParams.error} />;
}
