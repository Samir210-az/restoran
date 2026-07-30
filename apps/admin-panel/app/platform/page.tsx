import { Building2, PlusCircle, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Input,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@restoran/ui";
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
  searchParams: { rcreated?: string; rerror?: string };
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
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Restoran</TableHeaderCell>
              <TableHeaderCell>Sahib</TableHeaderCell>
              <TableHeaderCell>Plan</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>İşçi</TableHeaderCell>
              <TableHeaderCell>Yemək</TableHeaderCell>
              <TableHeaderCell>Sifariş</TableHeaderCell>
              <TableHeaderCell>Əməliyyat</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-text-muted">/{r.slug}</p>
                </TableCell>
                <TableCell className="text-text-secondary">{r.owner_email}</TableCell>
                <TableCell className="capitalize">{r.subscription_plan}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[r.subscription_status] ?? "neutral"}>
                    {STATUS_LABEL[r.subscription_status] ?? r.subscription_status}
                  </Badge>
                </TableCell>
                <TableCell>{r.staff_count}</TableCell>
                <TableCell>{r.menu_item_count}</TableCell>
                <TableCell>{r.order_count}</TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
