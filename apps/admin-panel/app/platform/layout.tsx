import Link from "next/link";
import { Shield } from "lucide-react";
import { ThemeToggle } from "@restoran/ui";
import { requirePlatformAdmin } from "@/lib/get-current-platform-admin";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * QEYD (bug duzelisi): platform admin restoran-scoped stafften TAMAM
 * ayri rol olmalidir (bax: get-current-platform-admin.ts). Evvelce
 * "Öz panelimə qayıt" linki HEMISE gorunurdu - platform admin hec bir
 * restoranda aktiv staff olmasa belə. Bu, real qarisiqliq yaradirdi:
 * meselen restoranin sahibliyini basqasina oturenden sonra da (kohne
 * sahib "manager"-e enirdi) bu link hemin restorana aparirdi, sanki
 * hele ora bagliymish kimi. Indi: link YALNIZ platform admin-in
 * HƏQIQƏTƏN aktiv staff rolu varsa gorunur.
 */
export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();

  const supabase = getSupabaseServerClient();
  const { data: activeStaffRow } = await supabase
    .from("staff_members")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-bg/80 px-4 backdrop-blur-md md:px-6">
        <Link href="/platform" className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" aria-hidden="true" />
          <span className="text-lg font-semibold text-text-primary">
            Platform Admin<span className="text-accent">.</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {activeStaffRow && (
            <Link href="/dashboard" className="text-sm text-text-secondary hover:text-text-primary">
              Öz panelimə qayıt
            </Link>
          )}
          <ThemeToggle />
        </div>
      </header>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
