import { getSupabaseServerClient } from "@/lib/supabase-server";

export interface CashShift {
  id: string;
  restaurant_id: string;
  opened_by: string;
  opened_by_name: string | null;
  opened_at: string;
  opening_cash: number;
  closed_by_name: string | null;
  closed_at: string | null;
  expected_cash: number | null;
  counted_cash: number | null;
  note: string | null;
}

export interface ShiftTotals {
  cash: number;
  card: number;
  online: number;
  orderCount: number;
  courierCash: { name: string; amount: number }[];
}

type ShiftClient = {
  from: (table: "cash_shifts") => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        is: (col: string, val: null) => { maybeSingle: () => Promise<{ data: CashShift | null }> };
        order: (col: string, opts: { ascending: boolean }) => {
          limit: (n: number) => Promise<{ data: CashShift[] | null }>;
        };
      };
    };
  };
};

export function shiftClient() {
  return getSupabaseServerClient() as unknown as ShiftClient;
}

export async function getOpenShift(restaurantId: string) {
  const { data } = await shiftClient()
    .from("cash_shifts")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .is("closed_at", null)
    .maybeSingle();
  return data;
}

export async function getRecentShifts(restaurantId: string) {
  const { data } = await shiftClient()
    .from("cash_shifts")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("opened_at", { ascending: false })
    .limit(15);
  return (data ?? []).filter((s) => s.closed_at);
}

export async function getShiftTotals(restaurantId: string, from: string, to?: string): Promise<ShiftTotals> {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("orders")
    .select("id, courier_id, order_type")
    .eq("restaurant_id", restaurantId)
    .eq("status", "completed")
    .gte("paid_at", from);
  if (to) query = query.lte("paid_at", to);
  const { data: orders } = await query;

  const totals: ShiftTotals = { cash: 0, card: 0, online: 0, orderCount: orders?.length ?? 0, courierCash: [] };
  if (!orders?.length) return totals;

  const { data: payments } = await supabase
    .from("payments")
    .select("order_id, amount, method")
    .eq("restaurant_id", restaurantId)
    .eq("status", "completed")
    .in("order_id", orders.map((o) => o.id));

  const orderById = new Map(orders.map((o) => [o.id, o]));
  const courierIds = new Set<string>();
  const byCourier = new Map<string, number>();

  for (const p of payments ?? []) {
    const amount = Number(p.amount);
    if (p.method === "card") totals.card += amount;
    else if (p.method === "online") totals.online += amount;
    else {
      totals.cash += amount;
      const order = orderById.get(p.order_id);
      if (order?.order_type === "delivery" && order.courier_id) {
        courierIds.add(order.courier_id);
        byCourier.set(order.courier_id, (byCourier.get(order.courier_id) ?? 0) + amount);
      }
    }
  }

  if (courierIds.size) {
    const { data: staff } = await (
      supabase as unknown as {
        rpc: (fn: string, args: unknown) => Promise<{ data: { id: string; full_name: string | null }[] | null }>;
      }
    ).rpc("get_staff_list", { _restaurant_id: restaurantId });
    const names = new Map((staff ?? []).map((s) => [s.id, s.full_name]));
    totals.courierCash = Array.from(byCourier, ([id, amount]) => ({ name: names.get(id) ?? "Kuryer", amount }));
  }

  return totals;
}
