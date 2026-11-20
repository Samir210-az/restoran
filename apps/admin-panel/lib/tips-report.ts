import { getSupabaseServerClient } from "@/lib/supabase-server";
import { staffNames } from "@/lib/cash-shift";

export type TipPeriod = "today" | "week" | "month";

export interface TipEntry {
  id: string;
  created_at: string;
  amount: number;
  method: string;
  waiterName: string;
  orderNumber: number | null;
}

export interface WaiterTipSummary {
  name: string;
  cash: number;
  card: number;
  total: number;
  count: number;
}

export function periodStart(period: TipPeriod, timeZone: string): Date {
  const now = new Date();
  const zoned = new Date(now.toLocaleString("en-US", { timeZone }));
  const offset = zoned.getTime() - now.getTime();
  let day = zoned.getDate();
  if (period === "week") day -= (zoned.getDay() + 6) % 7;
  if (period === "month") day = 1;
  return new Date(Date.UTC(zoned.getFullYear(), zoned.getMonth(), day) - offset);
}

type TipQuery = {
  eq: (c: string, v: string) => TipQuery;
  gte: (c: string, v: string) => TipQuery;
  order: (c: string, o: { ascending: boolean }) => TipQuery;
};

export async function getTipsReport(restaurantId: string, from: Date) {
  const supabase = getSupabaseServerClient();
  const client = supabase as unknown as {
    from: (t: "order_tips") => {
      select: (c: string) => TipQuery;
    };
  };
  const { data } = await (client
    .from("order_tips")
    .select("id, order_id, amount, method, waiter_id, created_at")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", from.toISOString())
    .order("created_at", { ascending: false }) as unknown as Promise<{
    data: { id: string; order_id: string; amount: number; method: string; waiter_id: string | null; created_at: string }[] | null;
  }>);

  const rows = data ?? [];
  const names = await staffNames(restaurantId);
  const orderIds = [...new Set(rows.map((r) => r.order_id))];
  const { data: orders } = orderIds.length
    ? await supabase.from("orders").select("id, order_number").in("id", orderIds)
    : { data: [] };
  const numberById = new Map((orders ?? []).map((o) => [o.id, o.order_number]));

  const entries: TipEntry[] = rows.map((r) => ({
    id: r.id,
    created_at: r.created_at,
    amount: Number(r.amount),
    method: r.method,
    waiterName: (r.waiter_id && names.get(r.waiter_id)) || "Ofisiant seçilməyib",
    orderNumber: numberById.get(r.order_id) ?? null,
  }));

  const byWaiter = new Map<string, WaiterTipSummary>();
  for (const e of entries) {
    const row = byWaiter.get(e.waiterName) ?? { name: e.waiterName, cash: 0, card: 0, total: 0, count: 0 };
    if (e.method === "card") row.card += e.amount;
    else row.cash += e.amount;
    row.total += e.amount;
    row.count += 1;
    byWaiter.set(e.waiterName, row);
  }

  return { entries, summary: [...byWaiter.values()].sort((a, b) => b.total - a.total) };
}

export interface WaiterBalance {
  waiterId: string;
  name: string;
  earned: number;
  paid: number;
  balance: number;
}

type SimpleQuery = { eq: (c: string, v: string) => Promise<{ data: { waiter_id: string | null; amount: number }[] | null }> };

/** Ofisiantın bütün vaxt üzrə qazandığı çay pulu ilə ona verilənin fərqi. */
export async function getTipBalances(restaurantId: string): Promise<WaiterBalance[]> {
  const client = getSupabaseServerClient() as unknown as {
    from: (t: "order_tips" | "tip_payouts") => { select: (c: string) => SimpleQuery };
  };
  const [{ data: tips }, { data: payouts }] = await Promise.all([
    client.from("order_tips").select("waiter_id, amount").eq("restaurant_id", restaurantId),
    client.from("tip_payouts").select("waiter_id, amount").eq("restaurant_id", restaurantId),
  ]);

  const names = await staffNames(restaurantId);
  const byWaiter = new Map<string, WaiterBalance>();
  const row = (id: string) =>
    byWaiter.get(id) ?? { waiterId: id, name: names.get(id) ?? "Ofisiant", earned: 0, paid: 0, balance: 0 };

  for (const t of tips ?? []) {
    if (!t.waiter_id) continue;
    const r = row(t.waiter_id);
    r.earned += Number(t.amount);
    byWaiter.set(t.waiter_id, r);
  }
  for (const p of payouts ?? []) {
    if (!p.waiter_id) continue;
    const r = row(p.waiter_id);
    r.paid += Number(p.amount);
    byWaiter.set(p.waiter_id, r);
  }
  return [...byWaiter.values()]
    .map((r) => ({ ...r, balance: Math.round((r.earned - r.paid) * 100) / 100 }))
    .sort((a, b) => b.balance - a.balance);
}
