import { Building2, PlusCircle, CheckCircle2, AlertCircle, ChevronRight, Users, UtensilsCrossed, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, Badge, Input } from "@restoran/ui";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { setRestaurantStatusAction, createRestaurantWithOwnerAction } from "./actions";

export const metadata = { title: "Platform Admin" };

const STATUS_BADGE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  trial: "warning",
  suspended: "danger",
  cancelled: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Aktiv",
  trial: "Sınaq",
  suspended: "Dayandırılıb",
  cancelled: "Ləğv edilib",
};

/**
 * Butun platformadaki restoranlarin "God view"-u. Melumat tek bir RPC
 * (`get_platform_overview`) cagirisi ile gelir - o, daxilde
 * is_platform_admin() yoxlamasi aparir, RLS-i bypass etmir, sadece
 * icazeni oz melumat sethirinde tetbiq edir.
 */
export default async function PlatformOverviewPage({
  searchParams,
}: {
  searchParams: { rcreated?: string; rerror?: string; rreset?: string; rdeleted?: string };
}) {
  const supabase = getSupabaseServerClient();
  const { data: restaurants } = await supabase.rpc("get_platform_overview");
  const rows = restaurants ?? [];

  const totalOrders = rows.reduce((sum, r) => sum + Number(r.order_count), 0);
  const activeCount = rows.filter((r) => r.subscription_status === "active" || r.subscription_status === "trial").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Bütün Restoranlar</h1>
        <p className="text-sm text-text-secondary">Platformadakı hər restoranın icmalı</p>
      </div>

      {searchParams.rcreated && (
        <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Restoran yaradıldı: <span className="font-medium">{searchParams.rcreated}</span> — giriş məlumatlarını sahibinə bildirin.
        </div>
      )}
      {searchParams.rreset && (
        <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="font-medium">{searchParams.rreset}</span> sıfırlandı — bütün test məlumatları silindi.
        </div>
      )}
      {searchParams.rdeleted && (
        <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="font-medium">{searchParams.rdeleted}</span> həmişəlik silindi.
        </div>
      )}
      {searchParams.rerror && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {searchParams.rerror}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-text-secondary">Ümumi restoran</p>
          <p className="mt-1 text-3xl font-semibold text-text-primary">{rows.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Aktiv/sınaqda</p>
          <p className="mt-1 text-3xl font-semibold text-text-primary">{activeCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Ümumi sifariş</p>
          <p className="mt-1 text-3xl font-semibold text-text-primary">{totalOrders}</p>
        </Card>
      </div>

      {rows.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Building2 className="h-8 w-8 text-text-muted" aria-hidden="true" />
            <p className="text-sm text-text-secondary">Hələ restoran qeydiyyatdan keçməyib</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <Card key={r.id} className="flex flex-col gap-3">
              {/* Butun kart deyil, YALNIZ bu hisse Link-dir - "Aktivlesdir/
                  Dayandır" duymesi asagida, Link-in KENARINDA (icinde
                  DEYIL) yerlesir ki, form/duyme ile keçidin klik
                  qarisiqligina sebeb olmasin. */}
              <Link href={`/platform/${r.id}`} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-accent">{r.name}</p>
                    <Badge variant={STATUS_BADGE[r.subscription_status] ?? "neutral"}>
                      {STATUS_LABEL[r.subscription_status] ?? r.subscription_status}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted">/{r.slug} · {r.owner_email}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
              </Link>

              <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" /> {r.staff_count} işçi
                </span>
                <span className="flex items-center gap-1">
                  <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden="true" /> {r.menu_item_count} yemək
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" /> {r.order_count} sifariş
                </span>
                <span className="capitalize">{r.subscription_plan} plan</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {r.subscription_status === "suspended" ? (
                  <form action={setRestaurantStatusAction.bind(null, r.id, "active")}>
                    <SubmitButton size="sm" variant="outline">
                      Aktivləşdir
                    </SubmitButton>
                  </form>
                ) : (
                  <form action={setRestaurantStatusAction.bind(null, r.id, "suspended")}>
                    <SubmitButton size="sm" variant="danger">
                      Dayandır
                    </SubmitButton>
                  </form>
                )}
                <Link
                  href={`/platform/${r.id}`}
                  className="flex items-center gap-1 rounded-md border border-border-strong px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-muted"
                >
                  Detallara bax <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="max-w-sm">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-accent" aria-hidden="true" />
              Yeni restoran + sahib hesabı yarat
            </CardTitle>
            <CardDescription>Müştəri ilə razılaşandan sonra birbaşa hesab yaradın — e-poçt təsdiqi olmadan dərhal aktivdir</CardDescription>
          </div>
        </CardHeader>
        <form action={createRestaurantWithOwnerAction} className="flex flex-col gap-3">
          <Input name="restaurant_name" placeholder="Restoranın adı" required />
          <Input name="owner_full_name" placeholder="Sahibin adı soyadı" required />
          <Input name="owner_email" type="email" placeholder="E-poçt (istəyə bağlı — boş qalsa avtomatik yaradılır)" />
          <Input name="password" type="password" placeholder="Şifrə (ən azı 6 simvol)" minLength={6} required />
          <SubmitButton className="self-start">Restoranı yarat</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
