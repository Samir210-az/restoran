import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createSupabasePublicClient } from "@restoran/supabase-client";
import { OrderTracker } from "@/components/order/OrderTracker";

interface PageProps {
  params: { slug: string; orderId: string };
}

export const metadata: Metadata = { title: "Sifarişiniz" };

/**
 * Sifaris izleme sehifesi: restoran.app/[slug]/order/[orderId]
 * Sifaris ID-si capability-token kimi ishlenir (bax: migration qeydi) -
 * bu linki bilen herkes statusu gore biler, elave giris teleb olunmur.
 */
async function getOrder(orderId: string) {
  const supabase = createSupabasePublicClient();

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, status, order_type, subtotal, tax, total, created_at, restaurant_id")
      .eq("id", orderId)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select("id, quantity, unit_price, kitchen_status, menu_item_id, menu_items(name)")
      .eq("order_id", orderId),
  ]);

  if (!order) return null;
  return { order, items: items ?? [] };
}

export default async function OrderTrackingPage({ params }: PageProps) {
  const data = await getOrder(params.orderId);
  if (!data) notFound();

  const items = data.items.map((row) => ({
    id: row.id,
    quantity: row.quantity,
    unit_price: row.unit_price,
    kitchen_status: row.kitchen_status,
    menu_item_id: row.menu_item_id,
    menu_items: row.menu_items as { name: Record<string, string> } | { name: Record<string, string> }[] | null,
  }));

  return <OrderTracker initialOrder={data.order} initialItems={items} />;
}
