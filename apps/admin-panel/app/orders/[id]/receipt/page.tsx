import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { PrintButton } from "@/components/orders/PrintButton";
import { localize } from "@restoran/utils";

export const metadata = { title: "Qəbz" };

interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
}

/**
 * Musteriye teqdim olunan ODENIŞ QƏBZI - çap üçün optimallaşdırılıb
 * (bax: PrintButton, @media print CSS aşağıda). Fiziki printer
 * inteqrasiyası YOXDUR - brauzerin öz "Çap et" funksiyası istifadə
 * olunur, bu, istənilən kağız/termal printerlə işləyir.
 */
export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const { restaurantId } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, total, discount_amount, created_at, order_type, table_id")
    .eq("id", params.id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (!order) notFound();

  const [{ data: restaurant }, { data: items }, { data: table }] = await Promise.all([
    supabase.from("restaurants").select("name, logo_url").eq("id", restaurantId).maybeSingle(),
    supabase
      .from("order_items")
      .select("quantity, unit_price, menu_items(name)")
      .eq("order_id", order.id),
    order.table_id
      ? supabase.from("restaurant_tables").select("table_number").eq("id", order.table_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const receiptItems: ReceiptItem[] = (items ?? []).map((i) => ({
    name: localize((i.menu_items as unknown as { name: Record<string, string> } | null)?.name, "az") || "Yemək",
    quantity: i.quantity,
    unit_price: Number(i.unit_price),
  }));

  const subtotal = receiptItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const discount = Number(order.discount_amount ?? 0);
  const finalTotal = Math.max(0, subtotal - discount);

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col bg-bg px-4 py-8 print:max-w-full print:px-0 print:py-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href="/orders"
          className="flex items-center gap-1.5 rounded-md border border-border-strong px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg-muted"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Sifarişlərə qayıt
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-xl border border-border bg-white p-6 text-black shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <div className="mb-4 flex flex-col items-center text-center">
          {restaurant?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={restaurant.logo_url} alt="" className="mb-2 h-14 w-14 rounded-full object-cover" />
          )}
          <h1 className="text-lg font-bold">{restaurant?.name ?? "Restoran"}</h1>
          <p className="mt-1 text-xs text-gray-500">
            Sifariş #{order.order_number} ·{" "}
            {new Date(order.created_at).toLocaleString("az-AZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
          {table?.table_number && <p className="text-xs text-gray-500">Masa {table.table_number}</p>}
        </div>

        <p className="mb-4 text-center text-sm font-medium">Bizi seçdiyiniz üçün təşəkkür edirik!</p>

        <div className="border-t border-dashed border-gray-300 py-3">
          {receiptItems.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-3 py-1 text-sm">
              <span>
                {item.quantity} × {item.name}
              </span>
              <span className="shrink-0 font-medium">{(item.quantity * item.unit_price).toFixed(2)} ₼</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 border-t border-dashed border-gray-300 py-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Ara cəm</span>
            <span>{subtotal.toFixed(2)} ₼</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Endirim</span>
              <span>-{discount.toFixed(2)} ₼</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-300 pt-2 text-base font-bold">
            <span>Ümumi</span>
            <span>{finalTotal.toFixed(2)} ₼</span>
          </div>
        </div>

        <p className="mt-4 text-center text-base font-semibold">Nuş olsun! 🍽️</p>
      </div>
    </div>
  );
}
