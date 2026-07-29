import { TrendingUp, ClipboardList, Users, Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@restoran/ui";
import { getCurrentContext } from "@/lib/get-current-context";

export const metadata = { title: "Ana Səhifə" };

/**
 * UI-ONLY: KPI kartlari statik struktur olaraq qurulub. Real melumat
 * (bugunku satis, aktiv sifarisler ve s.) Faza 3-de Supabase sorgulari
 * ve Realtime abunelikleri ile qosulacaq. Hazirda melumat yerine
 * struktur numunesi gosterilir.
 */
const KPI_CARDS = [
  { label: "Bugünkü satış", value: "—", icon: Wallet, hint: "Sifariş tamamlananda hesablanacaq" },
  { label: "Aktiv sifarişlər", value: "—", icon: ClipboardList, hint: "Realtime bağlantı Faza 3-də" },
  { label: "Bu ay yeni müştəri", value: "—", icon: Users, hint: "CRM Faza 9-da aktivləşəcək" },
  { label: "Aylıq artım", value: "—", icon: TrendingUp, hint: "Hesabat modulu Faza 11-də" },
] as const;

export default async function DashboardPage() {
  const context = await getCurrentContext();
  const greetingName = context?.fullName?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-text-primary">
          Xoş gəldiniz{greetingName ? `, ${greetingName}` : ""}
        </h1>
        <p className="text-sm text-text-secondary">
          {context?.restaurant?.name} idarə panelinə xoş gəldiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map(({ label, value, icon: Icon, hint }) => (
          <Card key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-text-primary">{value}</p>
              </div>
              <div className="rounded-md bg-accent-soft p-2 text-accent">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-xs text-text-muted">{hint}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Son sifarişlər</CardTitle>
            <CardDescription>Sifariş axını Faza 3-də (Realtime) qoşulacaq</CardDescription>
          </div>
          <Badge variant="accent">Tezliklə</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-12 text-center">
            <ClipboardList className="h-8 w-8 text-text-muted" aria-hidden="true" />
            <p className="text-sm text-text-secondary">Hələ sifariş yoxdur</p>
            <p className="text-xs text-text-muted">Sifariş axını qoşulduqda burada canlı görünəcək</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
