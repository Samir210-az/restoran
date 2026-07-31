import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { DashboardShell } from "@/components/layout/DashboardShell";

/**
 * Server Component olaraq staff kontekstini (restoran adi, rol) burada
 * tapiriq ve client-side DashboardShell-e prop kimi oturuk - bu sekilde
 * Sidebar/Topbar hem interaktiv (mobil aç/bağla) qala bilir, hem de
 * server-de teyin olunan real melumati gosterir.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();
  const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");

  return (
    <DashboardShell
      restaurantId={context.restaurantId}
      restaurantName={context.restaurantName}
      role={context.role}
      isPlatformAdmin={!!isPlatformAdmin}
    >
      {children}
    </DashboardShell>
  );
}
