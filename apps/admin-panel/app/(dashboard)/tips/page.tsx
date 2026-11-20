import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, Badge } from "@restoran/ui";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getTipsReport, periodStart, type TipPeriod } from "@/lib/tips-report";

export const metadata = { title: "Çay pulu" };

const PERIODS: { key: TipPeriod; label: string }[] = [
  { key: "today", label: "Bu gün" },
  { key: "week", label: "Bu həftə" },
  { key: "month", label: "Bu ay" },
];

const money = (value: number) => `${value.toFixed(2)} ₼`;

export default async function TipsPage({ searchParams }: { searchParams: { p?: string } }) {
  const { restaurantId, role } = await getCurrentStaffContext();
  if (role !== "owner" && role !== "manager" && role !== "cashier") redirect("/dashboard");

  const period: TipPeriod = searchParams.p === "week" || searchParams.p === "month" ? searchParams.p : "today";

  const { data: restaurant } = await getSupabaseServerClient()
    .from("restaurants")
    .select("timezone")
    .eq("id", restaurantId)
    .maybeSingle();
  const timeZone = restaurant?.timezone || "Asia/Baku";

  const { entries, summary } = await getTipsReport(restaurantId, periodStart(period, timeZone));
  const total = summary.reduce((sum, r) => sum + r.total, 0);
  const cash = summary.reduce((sum, r) => sum + r.cash, 0);
  const card = total - cash;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/tips?p=${p.key}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              p.key === period ? "border-accent bg-accent-soft text-accent" : "border-border text-text-secondary hover:bg-bg-muted"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Çay pulu: {money(total)}</CardTitle>
          <CardDescription>Nağd {money(cash)}, kartla {money(card)}. Gəlirə daxil deyil, ofisiantlar arasında bölünür.</CardDescription>
        </CardHeader>
        {summary.length === 0 ? (
          <p className="text-sm text-text-muted">Bu dövrdə çay pulu yoxdur</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border text-sm">
            {summary.map((r) => (
              <li key={r.name} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="font-medium text-text-primary">{r.name}</p>
                  <p className="text-text-secondary">
                    {r.count} dəfə · nağd {money(r.cash)} · kartla {money(r.card)}
                  </p>
                </div>
                <span className="text-base font-semibold text-text-primary">{money(r.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {entries.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Son qeydlər</CardTitle></CardHeader>
          <ul className="flex flex-col divide-y divide-border text-sm">
            {entries.slice(0, 40).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="font-medium text-text-primary">{e.waiterName}</p>
                  <p className="text-text-secondary">
                    {new Date(e.created_at).toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    {e.orderNumber !== null && ` · sifariş #${e.orderNumber}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={e.method === "card" ? "info" : "neutral"}>{e.method === "card" ? "Kart" : "Nağd"}</Badge>
                  <span className="font-semibold">{money(e.amount)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
