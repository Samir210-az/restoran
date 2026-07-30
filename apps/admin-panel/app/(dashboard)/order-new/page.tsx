import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { WaiterOrderForm } from "@/components/waiter/WaiterOrderForm";

export const metadata = { title: "Yeni Sifariş" };

export default async function NewOrderPage({ searchParams }: { searchParams: { table?: string } }) {
  const { restaurantId } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();

  const [{ data: categories }, { data: items }, { data: table }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select("id, category_id, name, price")
      .eq("restaurant_id", restaurantId)
      .eq("is_available", true)
      .order("sort_order", { ascending: true }),
    searchParams.table
      ? supabase.from("restaurant_tables").select("table_number").eq("id", searchParams.table).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const tableLabel = table?.table_number ? `Masa ${table.table_number}` : "Özün apar";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-text-primary">Yeni Sifariş</h1>
      <WaiterOrderForm
        categories={(categories ?? []) as unknown as { id: string; name: Record<string, string> }[]}
        items={(items ?? []) as unknown as { id: string; category_id: string; name: Record<string, string>; price: number }[]}
        tableId={searchParams.table ?? null}
        tableLabel={tableLabel}
      />
    </div>
  );
}
