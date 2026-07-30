import { createSupabasePublicClient } from "@restoran/supabase-client";

export interface CartLine {
  menuItemId: string;
  variantId?: string | null;
  quantity: number;
  specialInstructions?: string | null;
}

export interface PlaceOrderResult {
  orderId: string;
  total: number;
}

export type PaymentMethod = "cash" | "card" | "online";

/**
 * `place_order` RPC-sini cagirir. Qiymet HEC VAXT burdan gondermirik -
 * server (RPC daxilinde) menu_items cedvelinden yenidden hesablayir.
 * Bu, musterinin brauzer console-undan qiymeti deyismesinin qarsisini alir.
 */
export async function placeOrder(params: {
  restaurantId: string;
  tableId: string | null;
  orderType: "dine_in" | "takeaway" | "delivery";
  items: CartLine[];
  paymentMethod?: PaymentMethod;
  customerPhone?: string;
  customerName?: string;
}): Promise<PlaceOrderResult> {
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase.rpc("place_order", {
    _restaurant_id: params.restaurantId,
    _table_id: params.tableId,
    _order_type: params.orderType,
    _items: params.items.map((line) => ({
      menu_item_id: line.menuItemId,
      variant_id: line.variantId ?? null,
      quantity: line.quantity,
      special_instructions: line.specialInstructions ?? null,
    })),
    _payment_method: params.paymentMethod ?? "cash",
    _customer_phone: params.customerPhone ?? null,
    _customer_name: params.customerName ?? null,
  });

  if (error) {
    throw new Error(error.message.startsWith("EMPTY_ORDER") ? "Səbətiniz boşdur" : "Sifariş göndərilmədi, yenidən cəhd edin");
  }

  const row = Array.isArray(data) ? data[0] : data;
  return { orderId: row.order_id, total: Number(row.total) };
}
