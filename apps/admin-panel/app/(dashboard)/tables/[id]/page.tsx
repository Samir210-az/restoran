import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Table2, Plus, Receipt } from "lucide-react";
import { Card, Badge } from "@restoran/ui";
import { localize } from "@restoran/utils";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { markOrderServedAction, markPaymentReceivedAction, payAllTableOrdersAction } from "@/app/(dashboard)/orders/actions";

export const metadata = { title: "Masa hesabı" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Gözləyir",
  confirmed: "Təsdiqləndi",
  preparing: "Hazırlanır",
  ready: "Hazırdır",
  served: "Stola verildi",
  completed: "Ödənilib",
  cancelled: "Ləğv edilib",
};
const STATUS_BADGE: Record<string, "neutral" | "warning" | "success" | "danger" | "info" | "accent"> = {
  pending: "neutral",
  confirmed: "info",
  preparing: "warning",
  ready: "accent",
  served: "success",
  completed: "success",
  cancelled: "danger",
};

/**
 * Masa HESABI - Samir-in isteyi: administrator/menecer/ofisiant masaya
 * toxunanda bir masaya verilmiş BÜTÜN sifarişlər (bax: müştəri "əlavə
 * sifariş ver" - bir masaya bir neçə sifariş ola bilər) TƏK yerdə,
 * birləşdirilmiş hesab kimi görünsün, elə ordan da yeni sifariş əlavə
 * oluna, ödəniş bir dəfəyə qəbul oluna bilsin.
 */
export default async function TableDetailPage({ params }: { params: { id: string } }) {
  const { restaurantId, role } = await getCurrentStaffContext();
  const canServe = role === "owner" || role === "manager" || role === "waiter";
  const canTakePayment = role === "owner" || role === "manager" || role === "cashier";
  const supabase = getSupabaseServerClient();

  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("id, table_number, capacity")
    .eq("id", params.id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (!table) notFound();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, total, discount_amount, created_at")
    .eq("restaurant_id", restaurantId)
    .eq("table_id", table.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(20);

  const orderIds = (orders ?? []).map((o) => o.id);
  const [{ data: items }, { data: payments }] = await Promise.all([
    orderIds.length
      ? supabase.from("order_items").select("order_id, quantity, unit_price, menu_items(name)").in("order_id", orderIds)
      : Promise.resolve({ data: [] as { order_id: string; quantity: number; unit_price: number; menu_items: unknown }[] }),
    orderIds.length
      ? supabase.from("payments").select("order_id, status, method").in("order_id", orderIds)
      : Promise.resolve({ data: [] as { order_id: string; status: string; method: string }[] }),
  ]);

  const itemsByOrder = new Map<string, { name: string; quantity: number; unit_price: number }[]>();
  for (const i of items ?? []) {
    const name = localize((i.menu_items as unknown as { name: Record<string, string> } | null)?.name, "az") || "Yemək";
    const list = itemsByOrder.get(i.order_id) ?? [];
    list.push({ name, quantity: i.quantity, unit_price: Number(i.unit_price) });
    itemsByOrder.set(i.order_id, list);
  }
  const paymentByOrder = new Map((payments ?? []).map((p) => [p.order_id, p]));

  const openOrders = (orders ?? []).filter((o) => o.status !== "completed");
  const historyOrders = (orders ?? []).filter((o) => o.status === "completed");
  const openTotal = openOrders.reduce((sum, o) => sum + (Number(o.total) - Number(o.discount_amount)), 0);
  const anyPayable = openOrders.some((o) => (o.status === "ready" || o.status === "served") && paymentByOrder.get(o.id)?.status !== "completed");

  function renderOrderCard(o: (typeof openOrders)[number]) {
    const orderItems = itemsByOrder.get(o.id) ?? [];
    const payment = paymentByOrder.get(o.id);
    const finalTotal = Number(o.total) - Number(o.discount_amount);
    return (
      <Card key={o.id}>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-medium text-text-primary">Sifariş #{o.order_number}</p>
          <Badge variant={STATUS_BADGE[o.status] ?? "neutral"}>{STATUS_LABEL[o.status] ?? o.status}</Badge>
        </div>
        <div className="flex flex-col gap-1 text-sm text-text-secondary">
          {orderItems.map((it, idx) => (
            <div key={idx} className="flex justify-between">
              <span>
                {it.quantity} × {it.name}
              </span>
              <span>{(it.quantity * it.unit_price).toFixed(2)} ₼</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <span className="text-sm font-semibold text-text-primary">{finalTotal.toFixed(2)} ₼</span>
          <div className="flex gap-2">
            <Link
              href={`/orders/${o.id}/receipt`}
              target="_blank"
              className="flex items-center gap-1 rounded-md border border-border-strong px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-muted"
            >
              <Receipt className="h-3.5 w-3.5" aria-hidden="true" /> Qəbz
            </Link>
            {o.status === "ready" && canServe && (
              <form action={markOrderServedAction.bind(null, o.id)}>
                <SubmitButton size="sm" variant="outline">
                  Stola verildi
                </SubmitButton>
              </form>
            )}
            {(o.status === "ready" || o.status === "served") && canTakePayment && payment?.status !== "completed" && (
              <form action={markPaymentReceivedAction.bind(null, o.id)}>
                <SubmitButton size="sm" variant="outline">
                  Ödəniş alındı
                </SubmitButton>
              </form>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/tables" className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Masalar
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Table2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Masa {table.table_number}</h1>
          <p className="text-sm text-text-secondary">{table.capacity} nəfərlik · {openOrders.length} açıq sifariş</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/order-new?table=${table.id}`}
          className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Yeni sifariş
        </Link>
        {anyPayable && canTakePayment && (
          <form action={payAllTableOrdersAction.bind(null, table.id)}>
            <SubmitButton variant="outline">Hamısını ödə ({openTotal.toFixed(2)} ₼)</SubmitButton>
          </form>
        )}
      </div>

      {openOrders.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-text-secondary">Bu masada hazırda açıq sifariş yoxdur</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-secondary">Açıq hesab</h2>
            <span className="text-lg font-bold text-text-primary">{openTotal.toFixed(2)} ₼</span>
          </div>
          {openOrders.map(renderOrderCard)}
        </div>
      )}

      {historyOrders.length > 0 && (
        <details className="flex flex-col gap-3">
          <summary className="cursor-pointer text-sm font-semibold text-text-secondary">
            Tamamlanmış sifarişlər ({historyOrders.length})
          </summary>
          <div className="mt-3 flex flex-col gap-3">{historyOrders.map(renderOrderCard)}</div>
        </details>
      )}
    </div>
  );
}
