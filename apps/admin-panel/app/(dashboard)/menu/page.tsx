import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/get-current-context";
import { MenuManager } from "@/components/menu/MenuManager";

export const metadata = { title: "Menyu" };

export default async function MenuPage() {
  const context = await getCurrentContext();
  if (!context?.restaurant) redirect("/login");

  return <MenuManager restaurantId={context.restaurant.id} />;
}
