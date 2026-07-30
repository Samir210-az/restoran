import { Package, AlertTriangle, Truck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, Input, Badge } from "@restoran/ui";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { TransactionForm } from "@/components/inventory/TransactionForm";
import { createInventoryItemAction, createSupplierAction } from "./actions";

export const metadata = { title: "Anbar" };

export default async function InventoryPage() {
  const { restaurantId } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();

  const [{ data: items }, { data: suppliers }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, unit, current_stock, low_stock_threshold")
      .eq("restaurant_id", restaurantId)
      .order("name", { ascending: true }),
    supabase
      .from("suppliers")
      .select("id, name, contact_info")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false }),
  ]);

  const inventoryRows = items ?? [];
  const supplierRows = suppliers ?? [];
  const lowStockCount = inventoryRows.filter((i) => i.current_stock <= i.low_stock_threshold).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Anbar</h1>
        <p className="text-sm text-text-secondary">Stok səviyyələri və təchizatçılar</p>
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {lowStockCount} maddənin stoku azalıb — aşağıda qırmızı işarələnib
        </div>
      )}

      {inventoryRows.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Package className="h-8 w-8 text-text-muted" aria-hidden="true" />
            <p className="text-sm text-text-secondary">Hələ anbar maddəsi yoxdur</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {inventoryRows.map((item) => {
            const isLow = item.current_stock <= item.low_stock_threshold;
            return (
              <Card key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-text-primary">{item.name}</p>
                      {isLow && <Badge variant="danger">Stok azdır</Badge>}
                    </div>
                    <p className="text-sm text-text-secondary">
                      {item.current_stock} {item.unit} mövcuddur
                      {" · "}
                      minimum: {item.low_stock_threshold} {item.unit}
                    </p>
                  </div>
                  <TransactionForm itemId={item.id} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Yeni anbar maddəsi</CardTitle>
        </CardHeader>
        <form action={createInventoryItemAction} className="flex flex-col gap-3">
          <Input name="name" placeholder="Ad (məs. Toyuq döşü)" required />
          <Input name="unit" placeholder="Vahid (məs. kg, litr, ədəd)" required />
          <Input name="low_stock_threshold" type="number" step="0.01" placeholder="Minimum stok həddi" defaultValue={0} />
          <SubmitButton className="self-start">Maddə əlavə et</SubmitButton>
        </form>
      </Card>

      <div className="mt-4 flex items-center gap-2">
        <Truck className="h-5 w-5 text-text-secondary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-text-primary">Təchizatçılar</h2>
      </div>

      {supplierRows.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-sm text-text-secondary">Hələ təchizatçı yoxdur</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {supplierRows.map((s) => (
            <Card key={s.id}>
              <p className="font-medium text-text-primary">{s.name}</p>
              {(s.contact_info as { phone?: string })?.phone && (
                <p className="mt-1 text-sm text-text-secondary">{(s.contact_info as { phone?: string }).phone}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Yeni təchizatçı</CardTitle>
        </CardHeader>
        <form action={createSupplierAction} className="flex flex-col gap-3">
          <Input name="name" placeholder="Təchizatçı adı" required />
          <Input name="phone" type="tel" placeholder="Telefon (istəyə bağlı)" />
          <SubmitButton className="self-start">Təchizatçı əlavə et</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
