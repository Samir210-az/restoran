import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Users, UtensilsCrossed, ShoppingBag, Mail, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, Badge } from "@restoran/ui";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { ResetRestaurantButton } from "@/components/platform/ResetRestaurantButton";
import { DeleteRestaurantButton } from "@/components/platform/DeleteRestaurantButton";
import { setRestaurantStatusAction } from "../actions";

export const metadata = { title: "Restoran Detalları" };

const STATUS_BADGE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  trial: "warning",
  suspended: "danger",
  cancelled: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Aktiv",
  trial: "Sınaq",
  suspended: "Dayandırılıb",
  cancelled: "Ləğv edilib",
};

/**
 * Platform admin ucun TEK restoranin detal sehifesi - `/platform`
 * cedvelindeki restoran ADINA tıklayanda burasi acilir. Butun
 * "tehlukeli" emeliyyatlar (Sıfırla, Aktivlesdir/Dayandır) burada
 * daha aydin, tek-diqqetli yerde toplanir (cedveldeki kicik
 * duymelerden ferqli olaraq).
 */
export default async function PlatformRestaurantDetailPage({
  params,
  searchParams,
}: {
  params: { restaurantId: string };
  searchParams: { rreset?: string; rerror?: string };
}) {
  const supabase = getSupabaseServerClient();
  const { data: restaurants } = await supabase.rpc("get_platform_overview");
  const restaurant = (restaurants ?? []).find((r) => r.id === params.restaurantId);

  if (!restaurant) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/platform" className="mb-3 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Bütün restoranlar
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-text-primary">{restaurant.name}</h1>
          <Badge variant={STATUS_BADGE[restaurant.subscription_status] ?? "neutral"}>
            {STATUS_LABEL[restaurant.subscription_status] ?? restaurant.subscription_status}
          </Badge>
        </div>
        <p className="text-sm text-text-secondary">/{restaurant.slug}</p>
      </div>

      {searchParams.rreset && (
        <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="font-medium">{searchParams.rreset}</span> sıfırlandı — bütün test məlumatları silindi.
        </div>
      )}
      {searchParams.rerror && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {searchParams.rerror}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <div className="flex items-center gap-2 text-text-secondary">
            <Users className="h-4 w-4" aria-hidden="true" />
            <p className="text-sm">İşçi</p>
          </div>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{restaurant.staff_count}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-text-secondary">
            <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
            <p className="text-sm">Yemək</p>
          </div>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{restaurant.menu_item_count}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-text-secondary">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <p className="text-sm">Sifariş</p>
          </div>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{restaurant.order_count}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-text-secondary">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <p className="text-sm">Qeydiyyat</p>
          </div>
          <p className="mt-1 text-sm font-medium text-text-primary">
            {new Date(restaurant.created_at).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </Card>
      </div>

      <Card className="max-w-md">
        <div className="mb-3 flex items-center gap-2">
          <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
          <p className="font-medium text-text-primary">Sahib</p>
        </div>
        <p className="text-sm text-text-secondary">{restaurant.owner_email}</p>
        <p className="mt-1 text-xs capitalize text-text-muted">Plan: {restaurant.subscription_plan}</p>
      </Card>

      <Card className="max-w-md">
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-accent" aria-hidden="true" />
          <p className="font-medium text-text-primary">Abunəlik statusu</p>
        </div>
        {restaurant.subscription_status === "suspended" ? (
          <form action={setRestaurantStatusAction.bind(null, restaurant.id, "active")}>
            <SubmitButton variant="outline">Aktivləşdir</SubmitButton>
          </form>
        ) : (
          <form action={setRestaurantStatusAction.bind(null, restaurant.id, "suspended")}>
            <SubmitButton variant="danger">Dayandır</SubmitButton>
          </form>
        )}
      </Card>

      <Card className="max-w-md border-danger/30">
        <div className="mb-3">
          <p className="font-medium text-danger">Test məlumatlarını sıfırla</p>
          <p className="mt-1 text-xs text-text-secondary">
            Bütün sifarişlər, rezervasiyalar, müştərilər, xərclər həmişəlik silinir. Menyu, işçilər, masalar, brendinq qalır.
          </p>
        </div>
        <ResetRestaurantButton restaurantId={restaurant.id} restaurantName={restaurant.name} />
      </Card>

      <Card className="max-w-md border-danger/50">
        <div className="mb-3">
          <p className="font-medium text-danger">Restoranı həmişəlik sil</p>
          <p className="mt-1 text-xs text-text-secondary">
            Restoranın özü — menyu, işçilər, masalar, brendinq daxil, HAMISI — həmişəlik silinir. Qayıdılmazdır.
          </p>
        </div>
        <DeleteRestaurantButton restaurantId={restaurant.id} restaurantName={restaurant.name} />
      </Card>
    </div>
  );
}
