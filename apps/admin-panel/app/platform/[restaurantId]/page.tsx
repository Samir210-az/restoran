import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Users, UtensilsCrossed, ShoppingBag, Mail, Calendar, CheckCircle2, AlertCircle, UserCog, KeyRound } from "lucide-react";
import { Card, Badge, Input } from "@restoran/ui";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceClient } from "@restoran/supabase-client";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { ResetRestaurantButton } from "@/components/platform/ResetRestaurantButton";
import { DeleteRestaurantButton } from "@/components/platform/DeleteRestaurantButton";
import { setRestaurantStatusAction, transferRestaurantOwnerAction, regenerateAccessCodeAction, resetStaffPinAction } from "../actions";

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
  searchParams: { rreset?: string; rerror?: string; rowner?: string; rcode?: string; rpin?: string };
}) {
  const supabase = getSupabaseServerClient();
  const { data: restaurants } = await supabase.rpc("get_platform_overview");
  const restaurant = (restaurants ?? []).find((r) => r.id === params.restaurantId);

  if (!restaurant) notFound();

  const serviceClient = createSupabaseServiceClient();
  const { data: staffList } = await serviceClient
    .from("staff_members")
    .select("id, user_id, role, is_active, profiles(full_name)")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: true });

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
      {searchParams.rowner && (
        <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Sahiblik <span className="font-medium">{searchParams.rowner}</span>-a ötürüldü.
        </div>
      )}
      {searchParams.rcode && (
        <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Yeni restoran kodu: <span className="font-mono font-medium">{searchParams.rcode}</span> — indi qeyd edin, bir daha göstərilməyəcək.
        </div>
      )}
      {searchParams.rpin && (
        <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Yeni PIN: <span className="font-mono font-medium">{searchParams.rpin}</span> — bunu işçiyə bildirin.
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
          <UserCog className="h-4 w-4 text-accent" aria-hidden="true" />
          <p className="font-medium text-text-primary">Sahibliyi ötür</p>
        </div>
        <p className="mb-3 text-xs text-text-secondary">
          Mövcud e-poçt daxil etsəniz, həmin hesab sahib təyin olunur. Yeni e-poçt daxil etsəniz, tam ad və şifrə ilə yeni sahib
          hesabı yaradılır. Köhnə sahib avtomatik olaraq menecer roluna keçir (girişi qalır, sahiblik hüquqları götürülür).
        </p>
        <form action={transferRestaurantOwnerAction} className="flex flex-col gap-2.5">
          <input type="hidden" name="restaurant_id" value={restaurant.id} />
          <Input name="new_owner_email" type="email" placeholder="Yeni sahibin e-poçtu" required />
          <Input name="new_owner_full_name" placeholder="Yeni sahibin adı soyadı (yalnız yeni hesab üçün)" />
          <Input
            name="new_owner_password"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="6 rəqəmli PIN (yalnız yeni hesab üçün)"
            minLength={6}
          />
          <SubmitButton variant="outline" className="self-start">
            Sahibliyi ötür
          </SubmitButton>
        </form>
      </Card>

      <Card className="max-w-md">
        <div className="mb-3 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-accent" aria-hidden="true" />
          <p className="font-medium text-text-primary">Restoran girişi kodu</p>
        </div>
        <p className="mb-3 text-xs text-text-secondary">
          İşçilər cihazlarını bu restorana "ad + kod" ilə bağlayır. Kod gizli saxlanılır, yalnız yeniləndiyi an bir dəfə göstərilir.
        </p>
        <form action={regenerateAccessCodeAction.bind(null, restaurant.id)}>
          <SubmitButton variant="outline">Yeni kod yarat</SubmitButton>
        </form>
      </Card>

      <Card className="max-w-md">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" aria-hidden="true" />
          <p className="font-medium text-text-primary">İşçilər — PIN sıfırla</p>
        </div>
        <p className="mb-3 text-xs text-text-secondary">
          İşçi öz PIN-ini unudubsa (və ya köhnə, 6 rəqəmli olmayan şifrədirsə), burada 6 rəqəmli yeni PIN təyin edin.
        </p>
        <div className="flex flex-col divide-y divide-border">
          {(staffList ?? []).map((s) => {
            const fullName = (s.profiles as unknown as { full_name: string | null } | null)?.full_name ?? "İşçi";
            return (
              <div key={s.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">
                    {fullName} <span className="text-xs font-normal capitalize text-text-muted">· {s.role}</span>
                  </p>
                  {!s.is_active && <Badge variant="neutral">Deaktiv</Badge>}
                </div>
                <form action={resetStaffPinAction} className="flex items-center gap-2">
                  <input type="hidden" name="restaurant_id" value={restaurant.id} />
                  <input type="hidden" name="staff_user_id" value={s.user_id} />
                  <input
                    type="text"
                    name="new_pin"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    minLength={6}
                    placeholder="Yeni 6 rəqəmli PIN"
                    required
                    className="h-8 flex-1 rounded-md border border-border-strong bg-bg px-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <SubmitButton size="sm" variant="outline">
                    Sıfırla
                  </SubmitButton>
                </form>
              </div>
            );
          })}
          {(staffList ?? []).length === 0 && <p className="py-3 text-sm text-text-secondary">Heç bir işçi tapılmadı.</p>}
        </div>
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
