import { Plus, Table2 } from "lucide-react";
import { Card, CardHeader, CardTitle, Input, Button } from "@restoran/ui";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { CopyLinkButton } from "@/components/tables/CopyLinkButton";
import { createTableAction } from "./actions";

export const metadata = { title: "Masalar" };

/**
 * QEYD: Bu, tam Masa/Rezervasiya idareetmesi deyil (o, SAD Faza 4-de gelir) -
 * hazirda YALNIZ sifaris axininin ise dusmesi ucun minimum lazim olani
 * (masa yaratma + musteri linki) teqdim edir. Real QR sekil generasiyasi
 * ve rezervasiya sistemi Faza 4-de elave olunacaq.
 */
export default async function TablesPage() {
  const { restaurantId } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();

  const [{ data: restaurant }, { data: tables }] = await Promise.all([
    supabase.from("restaurants").select("slug").eq("id", restaurantId).maybeSingle(),
    supabase
      .from("restaurant_tables")
      .select("id, table_number, capacity, status")
      .eq("restaurant_id", restaurantId)
      .order("table_number", { ascending: true }),
  ]);

  const customerAppUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL ?? "http://localhost:3001";
  const slug = restaurant?.slug ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Masalar</h1>
        <p className="text-sm text-text-secondary">
          Hər masa üçün müştəri linki yaradın — bu linki QR koda çevirib masaya qoya bilərsiniz
        </p>
      </div>

      {(tables ?? []).length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Table2 className="h-8 w-8 text-text-muted" aria-hidden="true" />
            <p className="text-sm text-text-secondary">Hələ masa yoxdur</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(tables ?? []).map((table) => {
            const link = `${customerAppUrl}/${slug}?table=${table.id}`;
            return (
              <Card key={table.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-text-primary">Masa {table.table_number}</p>
                  <span className="text-xs text-text-muted">{table.capacity} nəfərlik</span>
                </div>
                <p className="truncate text-xs text-text-muted">{link}</p>
                <CopyLinkButton link={link} />
              </Card>
            );
          })}
        </div>
      )}

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Yeni masa</CardTitle>
        </CardHeader>
        <form action={createTableAction} className="flex flex-col gap-3">
          <Input name="table_number" placeholder="Masa nömrəsi (məs. 12)" required />
          <Input name="capacity" type="number" min="1" placeholder="Tutum (nəfər)" defaultValue={2} />
          <Button type="submit" leftIcon={<Plus className="h-4 w-4" />} className="self-start">
            Masa əlavə et
          </Button>
        </form>
      </Card>
    </div>
  );
}
