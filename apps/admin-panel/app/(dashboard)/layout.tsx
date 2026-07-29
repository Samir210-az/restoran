import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { DashboardShell } from "@/components/layout/DashboardShell";

/**
 * Server Component olaraq staff kontekstini (restoran adi, rol) burada
 * tapiriq ve client-side DashboardShell-e prop kimi oturuk - bu sekilde
 * Sidebar/Topbar hem interaktiv (mobil aç/bağla) qala bilir, hem de
 * server-de teyin olunan real melumati gosterir.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getCurrentStaffContext();

  return <DashboardShell restaurantName={context.restaurantName} role={context.role}>{children}</DashboardShell>;
}
