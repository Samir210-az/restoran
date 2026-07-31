import { Plus, Table2, Download } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { Card, CardHeader, CardTitle, Input } from "@restoran/ui";
import { cn } from "@restoran/utils";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { CopyLinkButton } from "@/components/tables/CopyLinkButton";
import { createTableAction } from "./actions";

export const metadata = { title: "Masalar" };

type TableStatus = "free" | "occupied" | "reserved";

const ACTIVE_ORDER_STATUSES: ("pending" | "confirmed" | "preparing" | "ready" | "served")[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
];

export default async function TablesPage() {
  const { restaurantId, role } = await getCurrentStaffContext();
  const canManageTables = role === "owner" || role === "manager";
  const supabase = getSupabaseServerClient();

  const [{ data: restaurant }, { data: tables }, { data: activeOrders }, { data: reservations }] = await Promise.all([
    supabase.from("restaurants").select("slug").eq("id", restaurantId).maybeSingle(),
    supabase
      .from("restaurant_tables")
      .select("id, table_number, capacity")
      .eq("restaurant_id", restaurantId)
      .order("table_number", { ascending: true }),
    supabase
      .from("orders")
      .select("id, table_id, status")
      .eq("restaurant_id", restaurantId)
      .not("table_id", "is", null)
      .in("status", ACTIVE_ORDER_STATUSES),
    supabase
      .from("reservations")
      .select("table_id, reserved_at")
      .eq("restaurant_id", restaurantId)
      .not("table_id", "is", null)
      .in("status", ["pending", "confirmed"])
      .gte("reserved_at", new Date().toISOString())
      .order("reserved_at", { ascending: true }),
  ]);

  const orderIds = (activeOrders ?? []).map((o) => o.id);
  const { data: payments } = orderIds.length
    ? await supabase.from("payments").select("order_id, status").in("order_id", orderIds)
    : { data: [] };
  const paymentStatusByOrder = new Map((payments ?? []).map((p) => [p.order_id, p.status]));

  // Masa "occupied" sayilir eger: aktiv (pending..ready) sifarisi varsa,
  // YA DA "served" olub amma odenis hele tamamlanmayibsa. Odenis
  // tamamlanan+served sifaris masani AZAD sayir (kassir pulu alanda
  // masa avtomatik bosalir - elave "masani azad et" duymesine ehtiyac yoxdur).
  const occupiedTableIds = new Set(
    (activeOrders ?? [])
      .filter((o) => {
        if (o.status !== "served") return true;
        return paymentStatusByOrder.get(o.id) !== "completed";
      })
      .map((o) => o.table_id)
      .filter(Boolean)
  );

  const reservationByTable = new Map<string, string>();
  for (const r of reservations ?? []) {
    if (r.table_id && !reservationByTable.has(r.table_id)) {
      reservationByTable.set(r.table_id, r.reserved_at);
    }
  }

  function getStatus(tableId: string): TableStatus {
    if (occupiedTableIds.has(tableId)) return "occupied";
    if (reservationByTable.has(tableId)) return "reserved";
    return "free";
  }

  const customerAppUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL ?? "http://localhost:3001";
  const slug = restaurant?.slug ?? "";
  const tableRows = tables ?? [];

  // Her masa ucun QR kodu AVTOMATIK, server terefinde generasiya olunur -
  // masa yaradilan kimi bu sehifeye girende deje hazir gorunur, ayrica
  // "QR yarat" duymesine ehtiyac yoxdur. Qara/ag saxlanilir (brend rengi
  // ile boyamaq skan etibarliligini azalda biler).
  const tableQrCodes = await Promise.all(
    tableRows.map(async (table) => {
      const link = `${customerAppUrl}/${slug}?table=${table.id}`;
      const qrDataUrl = await QRCode.toDataURL(link, { width: 320, margin: 1 });
      return { ...table, link, qrDataUrl };
    })
  );

  const STATUS_STYLE: Record<TableStatus, string> = {
    free: "border-success/40 bg-success/10 text-success",
    occupied: "border-danger/40 bg-danger/10 text-danger",
    reserved: "border-warning/40 bg-warning/10 text-warning",
  };
  const STATUS_LABEL: Record<TableStatus, string> = {
    free: "Boş",
    occupied: "Doludur",
    reserved: "Rezerv edilib",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Masalar</h1>
        <p className="text-sm text-text-secondary">
          Masaya toxunaraq həmin masa üçün dərhal sifariş verin — rəng masanın vəziyyətini göstərir
        </p>
      </div>

      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-success" /> Boş
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger" /> Doludur
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-warning" /> Rezerv edilib
        </span>
      </div>

      {tableRows.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Table2 className="h-8 w-8 text-text-muted" aria-hidden="true" />
            <p className="text-sm text-text-secondary">Hələ masa yoxdur</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {tableRows.map((table) => {
            const status = getStatus(table.id);
            const reservedAt = reservationByTable.get(table.id);
            const reservedTimeLabel = reservedAt
              ? new Date(reservedAt).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })
              : null;

            return (
              <Link
                key={table.id}
                href={`/order-new?table=${table.id}`}
                title={reservedTimeLabel ? `Rezervasiya saat ${reservedTimeLabel}` : STATUS_LABEL[status]}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 text-center transition-transform active:scale-95",
                  STATUS_STYLE[status]
                )}
              >
                <Table2 className="h-6 w-6" aria-hidden="true" />
                <span className="text-sm font-semibold">{table.table_number}</span>
                <span className="text-[10px] opacity-80">{STATUS_LABEL[status]}</span>
                {reservedTimeLabel && <span className="text-[10px] font-medium">{reservedTimeLabel}</span>}
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-2 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-secondary">Müştəri QR kodları</h2>
        <p className="text-xs text-text-muted">
          Hər masa üçün QR kod avtomatik yaradılır — yüklə, çap et, masaya qoy. Müştəri skan edəndə birbaşa həmin masa üçün menyuya düşür.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tableQrCodes.map((table) => (
            <Card key={table.id} className="flex flex-col items-center gap-3 text-center">
              <div className="flex w-full items-center justify-between">
                <p className="font-medium text-text-primary">Masa {table.table_number}</p>
                <span className="text-xs text-text-muted">{table.capacity} nəfərlik</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element -- data URI QR kod, next/image-a ehtiyac yoxdur */}
              <img src={table.qrDataUrl} alt={`Masa ${table.table_number} QR kodu`} className="h-40 w-40 rounded-md border border-border bg-white p-2" />
              <p className="w-full truncate text-xs text-text-muted">{table.link}</p>
              <div className="flex w-full gap-2">
                <CopyLinkButton link={table.link} />
                <a
                  href={table.qrDataUrl}
                  download={`masa-${table.table_number}-qr.png`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border-strong px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg-muted"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Yüklə
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {canManageTables && (
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Yeni masa</CardTitle>
          </CardHeader>
          <form action={createTableAction} className="flex flex-col gap-3">
            <Input name="table_number" placeholder="Masa nömrəsi (məs. 12)" required />
            <Input name="capacity" type="number" min="1" placeholder="Tutum (nəfər)" defaultValue={2} />
            <SubmitButton leftIcon={<Plus className="h-4 w-4" />} className="self-start">
              Masa əlavə et
            </SubmitButton>
          </form>
        </Card>
      )}
    </div>
  );
}
