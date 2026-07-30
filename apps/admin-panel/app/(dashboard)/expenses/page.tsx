import { redirect } from "next/navigation";
import { Receipt, PlusCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, Badge } from "@restoran/ui";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { ExpenseEntryForm } from "@/components/expenses/ExpenseEntryForm";
import { DeleteExpenseButton } from "@/components/reports/DeleteExpenseButton";

export const metadata = { title: "Xərclər" };

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
 * Xerclerin MERKEZI siyahisi. Yeni xerc elave etme formu YALNIZ bura
 * aid olmayan novleri ehate edir (techizatciya birbasa odenish, kira,
 * kommunal, vergi, diger) - cunki:
 * - Anbar alishi -> Anbar bolmesinde (mal medaxili ile birlikde)
 * - Maaş -> Isciler bolmesinde (konkret ishciye baglanaraq)
 * Amma bu sehifedeki SIYAHI hamisini gosterir - hansi bolmeden
 * elave olunmasindan asili olmayaraq, cunki hamisi eyni `expenses`
 * cedvelindedir.
 */
export default async function ExpensesPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const context = await getCurrentStaffContext();

  if (context.role !== "owner" && context.role !== "manager") {
    redirect("/dashboard");
  }

  const supabase = getSupabaseServerClient();

  const [{ data: expenses }, { data: suppliers }, { data: staffRows }] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, category, amount, description, expense_date, supplier_id, staff_member_id")
      .eq("restaurant_id", context.restaurantId)
      .order("expense_date", { ascending: false })
      .limit(100),
    supabase.from("suppliers").select("id, name").eq("restaurant_id", context.restaurantId).order("name"),
    (
      supabase as unknown as {
        rpc: (fn: string, args: unknown) => Promise<{ data: { id: string; full_name: string | null; role: string }[] | null }>;
      }
    ).rpc("get_staff_list", { _restaurant_id: context.restaurantId }),
  ]);

  const supplierNameById = new Map((suppliers ?? []).map((s) => [s.id, s.name]));
  const staffNameById = new Map((staffRows ?? []).map((s) => [s.id, s.full_name ?? "Adsız işçi"]));

  const totalAmount = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Xərclər</h1>
        <p className="text-sm text-text-secondary">
          Təchizatçıya ödəniş, kira, kommunal, vergi və digər xərclər — anbar alışı Anbar, maaş isə İşçilər bölməsindən əlavə olunur
        </p>
      </div>

      {searchParams.saved && (
        <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">Xərc əlavə olundu</div>
      )}
      {searchParams.error && (
        <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {searchParams.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="lg:order-2">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-accent" aria-hidden="true" />
                Yeni xərc əlavə et
              </CardTitle>
              <CardDescription>Təchizatçıya ödəniş, kira, kommunal, vergi, digər</CardDescription>
            </div>
          </CardHeader>
          <ExpenseEntryForm suppliers={suppliers ?? []} />
        </Card>

        <Card className="lg:order-1">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-accent" aria-hidden="true" />
                Bütün xərclər
              </CardTitle>
              <CardDescription>Son 100 qeyd · Cəmi {totalAmount.toFixed(2)} ₼</CardDescription>
            </div>
          </CardHeader>
          {(expenses ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-text-secondary">Hələ xərc qeyd olunmayıb</p>
          ) : (
            <div className="flex max-h-[32rem] flex-col divide-y divide-border overflow-y-auto">
              {(expenses ?? []).map((exp) => {
                const source =
                  exp.category === "inventory_purchase" && exp.supplier_id
                    ? supplierNameById.get(exp.supplier_id)
                    : exp.category === "salary" && exp.staff_member_id
                      ? staffNameById.get(exp.staff_member_id)
                      : exp.category === "supplier_payment" && exp.supplier_id
                        ? supplierNameById.get(exp.supplier_id)
                        : null;
                return (
                  <div key={exp.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={CATEGORY_BADGE[exp.category] ?? "neutral"}>{CATEGORY_LABELS[exp.category] ?? exp.category}</Badge>
                        <span className="text-xs text-text-muted">
                          {new Date(exp.expense_date).toLocaleDateString("az-AZ", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      {(source || exp.description) && (
                        <p className="mt-1 truncate text-sm text-text-secondary">{source ?? exp.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-medium text-danger">-{Number(exp.amount).toFixed(2)} ₼</span>
                      <DeleteExpenseButton expenseId={exp.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
