import { RoleLoginGate } from "@/components/auth/RoleLoginGate";
import { RestaurantPicker } from "@/components/auth/RestaurantPicker";
import { getDeviceRestaurantSlug, getBoundRestaurant, getRestaurantDirectory } from "./pin-actions";

export const metadata = { title: "Daxil ol" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const slug = await getDeviceRestaurantSlug();
  const restaurant = slug ? await getBoundRestaurant(slug) : null;

  // Cihaz hələ heç bir restorana bağlanmayıb (ilk açılış) - restoran
  // seçim ekranı göstərilir. Bir dəfə seçiləndən sonra (bax:
  // selectDeviceRestaurantAction) bu ekran BİR DAHA görünmür.
  if (!restaurant) {
    const restaurants = await getRestaurantDirectory();
    return <RestaurantPicker restaurants={restaurants} error={searchParams.error} />;
  }

  return <RoleLoginGate restaurant={restaurant} error={searchParams.error} />;
}
