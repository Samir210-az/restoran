import { notFound } from "next/navigation";
import { createSupabasePublicClient } from "@restoran/supabase-client";
import { OrderTracker, type OrderTrackingRow } from "@/components/order/OrderTracker";

interface PageProps {
  params: { slug: string; orderId: string };
}

export const metadata = { title: "Sifarişiniz" };

/**
 * Sifaris izleme sehifesi: restoran.app/[slug]/order/[orderId]
 * Sifaris ID-si capability-token kimi ishlenir - amma bu defe DUZGUN
 * tetbiq olunur: `get_order_tracking` RPC-si YALNIZ konkret ID ile TEK
 * setir qaytarir, siyahilama (`select *`) mumkun deyil. Evvelki versiya
 * (birbasa .from("orders").select()) buna RLS-de "true" siyaseti ile
 * icaze verirdi ki, bu da butun platformanin butun sifarişlerini
 * siyahilamaga imkan verirdi - tehlukesizlik boşluğu idi, baglanıb.
 */
async function getOrder(orderId: string) {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase.rpc("get_order_tracking", { _order_id: orderId });
  return data?.[0] ?? null;
}

export default async function OrderTrackingPage({ params }: PageProps) {
  const order = await getOrder(params.orderId);
  if (!order) notFound();

  return <OrderTracker orderId={order.id} initialOrder={order as unknown as OrderTrackingRow} />;
}
