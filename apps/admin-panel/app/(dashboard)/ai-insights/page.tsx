import { redirect } from "next/navigation";
import { TrendingUp, TrendingDown, ShoppingBag, PackageX, Star } from "lucide-react";
import { Card } from "@restoran/ui";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { InsightsChat } from "@/components/insights/InsightsChat";

export const metadata = { title: "AI Kəşfiyyat" };

interface BusinessSnapshot {
  revenue: { current_total: number; previous_total: number; order_count: number };
  top_selling_items: { name: string; quantity_sold: number }[];
  low_stock_items: { name: string }[];
  reviews: { review_count: number; avg_rating: number };
}

/**
 * FAZA 10: AI Biznes Kesfiyyati sehifesi. Yalniz owner/manager gore biler -
 * bu, HEM sehife terefinde (asagida redirect), HEM DE `get_business_snapshot`
 * RPC-sinde (DB terefinde) yoxlanilir - iki qatli qoruma.
 */
export default async function InsightsPage() {
  const context = await getCurrentStaffContext();

  if (context.role !== "owner" && context.role !== "manager") {
    redirect("/dashboard");
  }

  const supabase = getSupabaseServerClient();
  const { data: snapshot } = await (
    supabase as unknown as {
      rpc: (fn: string, args: unknown) => Promise<{ data: BusinessSnapshot | null }>;
    }
  ).rpc("get_business_snapshot", { _restaurant_id: context.restaurantId, _days: 30 });

  const revenueUp = snapshot ? snapshot.revenue.current_total >= snapshot.revenue.previous_total : true;
  const revenueChangePct =
    snapshot && snapshot.revenue.previous_total > 0
      ? Math.abs(((snapshot.revenue.current_total - snapshot.revenue.previous_total) / snapshot.revenue.previous_total) * 100).toFixed(0)
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">AI Kəşfiyyat</h1>
        <p className="text-sm text-text-secondary">Son 30 gün — restoranınız haqqında sual verin, real rəqəmlərlə cavab alın</p>
      </div>

      {snapshot && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <div className="flex items-center gap-2 text-text-secondary">
              {revenueUp ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-danger" />}
              <p className="text-sm">Gəlir (30 gün)</p>
            </div>
            <p className="mt-1 text-2xl font-semibold text-text-primary">{Number(snapshot.revenue.current_total).toFixed(0)} ₼</p>
            {revenueChangePct !== null && (
              <p className={`text-xs ${revenueUp ? "text-success" : "text-danger"}`}>
                {revenueUp ? "+" : "-"}
                {revenueChangePct}% əvvəlki dövrə görə
              </p>
            )}
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-text-secondary">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <p className="text-sm">Sifariş sayı</p>
            </div>
            <p className="mt-1 text-2xl font-semibold text-text-primary">{snapshot.revenue.order_count}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-text-secondary">
              <PackageX className="h-4 w-4" aria-hidden="true" />
              <p className="text-sm">Anbarda azalan</p>
            </div>
            <p className="mt-1 text-2xl font-semibold text-text-primary">{snapshot.low_stock_items.length}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-text-secondary">
              <Star className="h-4 w-4" aria-hidden="true" />
              <p className="text-sm">Orta reytinq</p>
            </div>
            <p className="mt-1 text-2xl font-semibold text-text-primary">
              {snapshot.reviews.review_count > 0 ? snapshot.reviews.avg_rating : "—"}
            </p>
          </Card>
        </div>
      )}

      <InsightsChat />
    </div>
  );
}
