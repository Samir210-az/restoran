import Link from "next/link";
import { TrendingUp, TrendingDown, ClipboardList, Users, Wallet, Table2, ChefHat, Wallet2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@restoran/ui";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { BigIconTile } from "@/components/dashboard/BigIconTile";

export const metadata = { title: "Ana Səhifə" };

const STATUS_BADGE: Record<string, "neutral" | "warning" | "success" | "danger" | "info" | "accent"> = {
  pending: "neutral",
  confirmed: "info",
  preparing: "warning",
  ready: "accent",
  served: "success",
  completed: "success",
  cancelled: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Gözləyir",
  confirmed: "Təsdiqləndi",
  preparing: "Hazırlanır",
  ready: "Hazırdır",
  served: "Təqdim edildi",
  completed: "Tamamlandı",
  cancelled: "Ləğv edilib",
};

const ACTIVE_STATUSES: ("pending" | "confirmed" | "preparing" | "ready" | "served")[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
];

/**
 * Dashboard MEZMUNU rola gore tam ferqlenir - "hamisi eyni panel" evezine
 * her isci OZ sahesi ucun uygun ilk ekrani gorur:
 * - waiter: boyuk "Masalar" ve "Sifarişlər" ikonlari + BUGUNKU OZ satisi
 *   (orders.created_by = bu isci - bax: place_order RPC-nin yeni parametri)
 * - chef: boyuk "Metbex Ekrani" ikonu
 * - cashier: boyuk "Sifarişlər"/"Masalar" ikonlari
 * - owner/manager: tam KPI dashboard (evvelki kimi)
 * Butun bunlar eyni melumat bazasindan gelir - owner "Sifarişlər"de
 * hamisini bir yerde gorur, bu sadece HERKESIN ILK GORDUYU sehife ferqlidir.
 */
export default async function DashboardPage() {
  const context = await getCurrentStaffContext();
  const greetingName = context.fullName?.split(" ")[0] ?? "";
  const supabase = getSupabaseServerClient();

  if (context.role === "waiter" || context.role === "cashier") {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data: myOrders } = await supabase
      .from("orders")
      .select("total")
      .eq("restaurant_id", context.restaurantId)
      .eq("created_by", context.userId)
      .neq("status", "cancelled")
      .gte("created_at", startOfToday);

    const mySalesToday = (myOrders ?? []).reduce((sum, o) => sum + Number(o.total), 0);

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Xoş gəldiniz{greetingName ? `, ${greetingName}` : ""}
          </h1>
          <p className="text-sm text-text-secondary">{context.restaurantName}</p>
        </div>

        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Wallet2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Bugünkü satışım</p>
              <p className="text-2xl font-semibold text-text-primary">{mySalesToday.toFixed(2)} ₼</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <BigIconTile href="/tables" icon={Table2} label="Masalar" description="Toxunub sifariş al" />
          <BigIconTile href="/orders" icon={ClipboardList} label="Sifarişlər" description="Bütün sifarişlər" />
          {context.role === "cashier" && (
            <BigIconTile href="/reservations" icon={Users} label="Rezervasiyalar" description="Gələn müştərilər" />
          )}
        </div>
      </div>
    );
  }

  if (context.role === "chef") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Xoş gəldiniz{greetingName ? `, ${greetingName}` : ""}
          </h1>
          <p className="text-sm text-text-secondary">{context.restaurantName}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <BigIconTile href="/kitchen" icon={ChefHat} label="Mətbəx Ekranı" description="Sıradakı sifarişlər" />
          <BigIconTile href="/orders" icon={ClipboardList} label="Sifarişlər" description="Bütün sifarişlər" />
        </div>
      </div>
    );
  }

  // owner / manager - tam KPI dashboard
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [todayOrders, activeOrders, newCustomers, thisMonthOrders, lastMonthOrders, recentOrders] = await Promise.all([
    supabase
      .from("orders")
      .select("total")
      .eq("restaurant_id", context.restaurantId)
      .neq("status", "cancelled")
      .gte("created_at", startOfToday),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", context.restaurantId)
      .in("status", ACTIVE_STATUSES),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", context.restaurantId)
      .gte("created_at", startOfThisMonth),
    supabase
      .from("orders")
      .select("total")
      .eq("restaurant_id", context.restaurantId)
      .neq("status", "cancelled")
      .gte("created_at", startOfThisMonth),
    supabase
      .from("orders")
      .select("total")
      .eq("restaurant_id", context.restaurantId)
      .neq("status", "cancelled")
      .gte("created_at", startOfLastMonth)
      .lt("created_at", startOfThisMonth),
    supabase
      .from("orders")
      .select("id, order_number, status, order_type, total, created_at")
      .eq("restaurant_id", context.restaurantId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const todaySales = (todayOrders.data ?? []).reduce((sum, o) => sum + Number(o.total), 0);
  const thisMonthTotal = (thisMonthOrders.data ?? []).reduce((sum, o) => sum + Number(o.total), 0);
  const lastMonthTotal = (lastMonthOrders.data ?? []).reduce((sum, o) => sum + Number(o.total), 0);
  const growthPct = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : null;

  const kpiCards = [
    { label: "Bugünkü satış", value: `${todaySales.toFixed(2)} ₼`, icon: Wallet },
    { label: "Aktiv sifarişlər", value: String(activeOrders.count ?? 0), icon: ClipboardList },
    { label: "Bu ay yeni müştəri", value: String(newCustomers.count ?? 0), icon: Users },
    {
      label: "Aylıq artım",
      value: growthPct === null ? "—" : `${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(0)}%`,
      icon: growthPct !== null && growthPct < 0 ? TrendingDown : TrendingUp,
    },
  ];

  const orders = recentOrders.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-text-primary">
          Xoş gəldiniz{greetingName ? `, ${greetingName}` : ""}
        </h1>
        <p className="text-sm text-text-secondary">
          {context.restaurantName} idarə panelinə xoş gəldiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-text-primary">{value}</p>
              </div>
              <div className="rounded-md bg-accent-soft p-2 text-accent">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Son sifarişlər</CardTitle>
            <CardDescription>Ən son 5 sifariş</CardDescription>
          </div>
          <Link href="/orders">
            <Badge variant="accent">Hamısına bax</Badge>
          </Link>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-12 text-center">
              <ClipboardList className="h-8 w-8 text-text-muted" aria-hidden="true" />
              <p className="text-sm text-text-secondary">Hələ sifariş yoxdur</p>
              <p className="text-xs text-text-muted">Müştəri sifariş verdikdə burada görünəcək</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-text-muted">
                      #{o.order_number} · {new Date(o.created_at).toLocaleDateString("az-AZ", { day: "numeric", month: "short" })}
                    </span>
                    <Badge variant={STATUS_BADGE[o.status] ?? "neutral"}>{STATUS_LABEL[o.status] ?? o.status}</Badge>
                  </div>
                  <span className="font-medium text-text-primary">{Number(o.total).toFixed(2)} ₼</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
