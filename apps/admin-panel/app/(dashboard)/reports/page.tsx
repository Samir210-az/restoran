import { redirect } from "next/navigation";
import { CalendarDays, CalendarRange, Calendar, Receipt } from "lucide-react";
import { Card, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@restoran/ui";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const metadata = { title: "Hesabatlar" };

interface PeriodStat {
  order_count: number;
  revenue: number;
}

interface DailyRow {
  report_date: string;
  order_count: number;
  revenue: number;
}

interface OrderReport {
  today: PeriodStat;
  this_week: PeriodStat;
  this_month: PeriodStat;
  daily_breakdown: DailyRow[];
}

/**
 * Hesabatlar sehifesi: gunluk/heftelik/ayliq sifaris sayi + gelir.
 * `get_order_report` RPC-si restoranin OZ saat qursagina (timezone)
 * gore "bugun/bu hefte/bu ay" sinirlarini Postgres terefinde
 * hesablayir (bax: place_order-daki gunluk sifaris nomresi ile eyni
 * saat qursagi mentiqi - ikisi uygun olsun deye).
 */
export default async function ReportsPage() {
  const context = await getCurrentStaffContext();

  if (context.role !== "owner" && context.role !== "manager") {
    redirect("/dashboard");
  }

  const supabase = getSupabaseServerClient();
  const { data: report } = await (
    supabase as unknown as {
      rpc: (fn: string, args: unknown) => Promise<{ data: OrderReport | null }>;
    }
  ).rpc("get_order_report", { _restaurant_id: context.restaurantId });

  const today = report?.today ?? { order_count: 0, revenue: 0 };
  const thisWeek = report?.this_week ?? { order_count: 0, revenue: 0 };
  const thisMonth = report?.this_month ?? { order_count: 0, revenue: 0 };
  const dailyBreakdown = report?.daily_breakdown ?? [];

  const cards = [
    { label: "Bu gün", icon: CalendarDays, stat: today },
    { label: "Bu həftə", icon: CalendarRange, stat: thisWeek },
    { label: "Bu ay", icon: Calendar, stat: thisMonth },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Hesabatlar</h1>
        <p className="text-sm text-text-secondary">Gündəlik, həftəlik və aylıq sifariş sayı və gəlir</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map(({ label, icon: Icon, stat }) => (
          <Card key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-text-primary">{stat.order_count}</p>
                <p className="mt-1 text-xs text-text-muted">sifariş</p>
              </div>
              <div className="rounded-md bg-accent-soft p-2 text-accent">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 border-t border-border pt-3 text-sm font-medium text-text-primary">
              {Number(stat.revenue).toFixed(2)} ₼ gəlir
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-accent" aria-hidden="true" />
          <div>
            <p className="font-medium text-text-primary">Son 14 gün — gündəlik təfərrüat</p>
            <p className="text-xs text-text-secondary">Ləğv edilmiş sifarişlər daxil deyil</p>
          </div>
        </div>

        {dailyBreakdown.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-secondary">Bu dövrdə sifariş qeydə alınmayıb</p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Tarix</TableHeaderCell>
                <TableHeaderCell>Sifariş sayı</TableHeaderCell>
                <TableHeaderCell>Gəlir</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dailyBreakdown.map((row) => (
                <TableRow key={row.report_date}>
                  <TableCell>
                    {new Date(row.report_date).toLocaleDateString("az-AZ", {
                      day: "numeric",
                      month: "long",
                      weekday: "short",
                    })}
                  </TableCell>
                  <TableCell>{row.order_count}</TableCell>
                  <TableCell>{Number(row.revenue).toFixed(2)} ₼</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
