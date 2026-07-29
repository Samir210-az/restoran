import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getCurrentContext } from "@/lib/get-current-context";

/**
 * Dashboard qatına daxil olan bütün səhifələr üçün TEK auth qapısı.
 * İstifadəçi daxil olmayıbsa /login-ə yönləndirilir; daxil olub, amma
 * heç bir restorana bağlı deyilsə (nadir hal), yenidən onboarding axınına.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getCurrentContext();

  if (!context) {
    redirect("/login");
  }

  if (!context.restaurant) {
    redirect("/register");
  }

  const userInitial = (context.fullName?.[0] ?? "R").toUpperCase();

  return (
    <DashboardShell restaurantName={context.restaurant.name} userInitial={userInitial}>
      {children}
    </DashboardShell>
  );
}
