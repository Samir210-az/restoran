import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, CalendarRange, Calendar, Receipt, TrendingUp, Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, Badge, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@restoran/ui";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { DeleteExpenseButton } from "@/components/reports/DeleteExpenseButton";

export const metadata = { title: "Hesabatlar" };

interface PeriodStat {
  order_count: number;
  revenue: number;
  expenses: number;
}

interface DailyRow {
  report_date: string;
  order_count: number;
  revenue: number;
  expenses: number;
}

interface ExpenseRow {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  expense_date: string;
  supplier_name: string | null;
  staff_name: string | null;
}

interface OrderReport {
  today: PeriodStat;
  this_week: PeriodStat;
  this_month: PeriodStat & { expenses_by_category: Record<string, number> };
  daily_breakdown: DailyRow[];
  recent_expenses: ExpenseRow[];
}

const CATEGORY_LABELS: Record<string, string> = {
  inventory_purchase: "Anbar alışı",
  salary: "Maaş",
  rent: "Kira",
  utility: "Kommunal",
  tax: "Vergi",
  supplier_payment: "Təchizatçıya ödəniş",
  other: "Digər",
};

const CATEGORY_BADGE: Record<string, "neutral" | "warning" | "success" | "danger" | "info" | "accent"> = {
  inventory_purchase: "info",
  salary: "accent",
  rent: "warning",
  utility: "warning",
  tax: "danger",
  supplier_payment: "info",
  other: "neutral",
};

/**
 * Hesabatlar sehifesi - TAM maliyye tesviri: Gelir - Xerc = Qazanc,
 * gunluk/heftelik/ayliq, + xerc qeyd etme (anbar alishi, maaş, kira,
 * kommunal, diger). `get_order_report` RPC-si restoranin OZ saat
 * qursagina gore dovrleri hesablayir (bax: place_order-daki gunluk
 * sifaris nomresi ile eyni mentiq).
 */
export default async function ReportsPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const context = await getCurrentStaffContext();

  if (context.role !== "owner" && context.role !== "manager") {
    redirect("/dashboard");
  }

  const supabase = getSupabaseServerClient();

  const { data: report } = await (
    supabase as unknown as { rpc: (fn: string, args: unknown) => Promise<{ data: OrderReport | null }> }
  ).rpc("get_order_report", { _restaurant_id: context.restaurantId });

  const today = report?.today ?? { order_count: 0, revenue: 0, expenses: 0 };
  const thisWeek = report?.this_week ?? { order_count: 0, revenue: 0, expenses: 0 };
  const thisMonth = report?.this_month ?? { order_count: 0, revenue: 0, expenses: 0, expenses_by_category: {} };
  const dailyBreakdown = report?.daily_breakdown ?? [];
  const recentExpenses = report?.recent_expenses ?? [];

  const cards = [
    { label: "Bu gün", icon: CalendarDays, stat: today },
    { label: "Bu həftə", icon: CalendarRange, stat: thisWeek },
    { label: "Bu ay", icon: Calendar, stat: thisMonth },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Hesabatlar</h1>
        <p className="text-sm text-text-secondary">Gəlir, xərc, qazanc və satış sayı — gündəlik, həftəlik, aylıq</p>
      </div>

      {searchParams.saved && (
        <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">Xərc əlavə olundu</div>
      )}
      {searchParams.error && (
        <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {searchParams.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map(({ label, icon: Icon, stat }) => {
          const profit = Number(stat.revenue) - Number(stat.expenses);
          return (
            <Card key={label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-text-secondary">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-text-primary">{stat.order_count}</p>
                  <p className="mt-1 text-xs text-text-muted">satış</p>
                </div>
                <div className="rounded-md bg-accent-soft p-2 text-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Gəlir</span>
                  <span className="font-medium text-success">+{Number(stat.revenue).toFixed(2)} ₼</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Xərc</span>
                  <span className="font-medium text-danger">-{Number(stat.expenses).toFixed(2)} ₼</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-1">
                  <span className="font-medium text-text-primary">Qazanc</span>
                  <span className={`font-semibold ${profit >= 0 ? "text-success" : "text-danger"}`}>
                    {profit >= 0 ? "+" : ""}
                    {profit.toFixed(2)} ₼
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {Object.keys(thisMonth.expenses_by_category ?? {}).length > 0 && (
        <Card>
          <p className="mb-3 text-sm font-medium text-text-primary">Bu ayın xərcləri — kateqoriya üzrə</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(thisMonth.expenses_by_category).map(([cat, amt]) => (
              <div key={cat} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                <Badge variant={CATEGORY_BADGE[cat] ?? "neutral"}>{CATEGORY_LABELS[cat] ?? cat}</Badge>
                <span className="font-medium text-text-primary">{Number(amt).toFixed(2)} ₼</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-accent" aria-hidden="true" />
              Son xərclər
            </CardTitle>
            <CardDescription>Ən son 20 qeyd — anbar alışı, maaş, ödənişlər, hamısı bir yerdə</CardDescription>
          </div>
          <Link
            href="/expenses"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-muted"
          >
            <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
            Xərc əlavə et
          </Link>
        </CardHeader>
        {recentExpenses.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-secondary">Hələ xərc qeyd olunmayıb</p>
          ) : (
            <div className="flex max-h-96 flex-col divide-y divide-border overflow-y-auto">
              {recentExpenses.map((exp) => (
                <div key={exp.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={CATEGORY_BADGE[exp.category] ?? "neutral"}>{CATEGORY_LABELS[exp.category] ?? exp.category}</Badge>
                      <span className="text-xs text-text-muted">
                        {new Date(exp.expense_date).toLocaleDateString("az-AZ", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {(exp.description || exp.supplier_name || exp.staff_name) && (
                      <p className="mt-1 truncate text-sm text-text-secondary">
                        {exp.supplier_name ?? exp.staff_name ?? exp.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-medium text-danger">-{Number(exp.amount).toFixed(2)} ₼</span>
                    <DeleteExpenseButton expenseId={exp.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" aria-hidden="true" />
          <div>
            <p className="font-medium text-text-primary">Son 14 gün — gündəlik təfərrüat</p>
            <p className="text-xs text-text-secondary">Ləğv edilmiş sifarişlər gəlirə daxil deyil</p>
          </div>
        </div>

        {dailyBreakdown.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-secondary">Bu dövrdə məlumat yoxdur</p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Tarix</TableHeaderCell>
                <TableHeaderCell>Satış</TableHeaderCell>
                <TableHeaderCell>Gəlir</TableHeaderCell>
                <TableHeaderCell>Xərc</TableHeaderCell>
                <TableHeaderCell>Qazanc</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dailyBreakdown.map((row) => {
                const profit = Number(row.revenue) - Number(row.expenses);
                return (
                  <TableRow key={row.report_date}>
                    <TableCell>
                      {new Date(row.report_date).toLocaleDateString("az-AZ", { day: "numeric", month: "long" })}
                    </TableCell>
                    <TableCell>{row.order_count}</TableCell>
                    <TableCell className="text-success">{Number(row.revenue).toFixed(2)} ₼</TableCell>
                    <TableCell className="text-danger">{Number(row.expenses).toFixed(2)} ₼</TableCell>
                    <TableCell className={profit >= 0 ? "text-success" : "text-danger"}>{profit.toFixed(2)} ₼</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
