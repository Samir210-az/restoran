import { Palette, ImageIcon, ExternalLink, CreditCard, ShieldCheck, Landmark } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, Input, Badge } from "@restoran/ui";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { ThemeColorPicker } from "@/components/settings/ThemeColorPicker";
import { updateRestaurantBrandingAction, updatePaymentSettingsAction, updateCardTransferAction } from "./actions";

export const metadata = { title: "Parametrlər" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const context = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();
  const [{ data: restaurant }, { data: paymentStatusRows }, { data: cardTransfer }] = await Promise.all([
    supabase.from("restaurants").select("name, slug, logo_url, theme_color").eq("id", context.restaurantId).maybeSingle(),
    (
      supabase as unknown as {
        rpc: (
          fn: string,
          args: unknown
        ) => Promise<{ data: { provider: string; merchant_id: string | null; is_active: boolean; has_secret: boolean }[] | null }>;
      }
    ).rpc("get_payment_settings_status", { _restaurant_id: context.restaurantId }),
    supabase
      .from("restaurant_card_transfer")
      .select("card_number, card_holder_name, bank_name, is_active")
      .eq("restaurant_id", context.restaurantId)
      .maybeSingle(),
  ]);
  const paymentStatus = paymentStatusRows?.[0] ?? null;

  const customerAppUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL;
  const publicPageUrl = customerAppUrl && restaurant ? `${customerAppUrl}/${restaurant.slug}` : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Parametrlər</h1>
        <p className="text-sm text-text-secondary">Restoranınızın müştəri saytındakı görünüşünü idarə edin</p>
      </div>

      {searchParams.saved && (
        <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          Dəyişikliklər yadda saxlanıldı
        </div>
      )}
      {searchParams.error && (
        <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {searchParams.error}
        </div>
      )}

      <Card className="max-w-md">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-accent" aria-hidden="true" />
              Brendinq
            </CardTitle>
            <CardDescription>
              Loqo və tema rəngi müştərilərin gördüyü ana səhifə siyahısında və menyu səhifənizdə əks olunur
            </CardDescription>
          </div>
        </CardHeader>

        {publicPageUrl && (
          <a
            href={publicPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
          >
            Müştəri səhifəmi görüntülə <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}

        {context.role !== "owner" ? (
          <p className="text-sm text-text-secondary">Brendinq parametrlərini yalnız restoran sahibi dəyişə bilər.</p>
        ) : (
          <form action={updateRestaurantBrandingAction} className="flex flex-col gap-5" encType="multipart/form-data">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-bg-muted">
                {restaurant?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- kicik avatar-oxsari onizleme, next/image lazim deyil
                  <img src={restaurant.logo_url} alt="Loqo" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-text-muted" aria-hidden="true" />
                )}
              </div>
              <label className="flex flex-1 flex-col gap-1.5 text-sm">
                <span className="font-medium text-text-primary">Loqo</span>
                <input
                  type="file"
                  name="logo"
                  accept="image/png,image/jpeg,image/webp"
                  className="text-xs text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent hover:file:opacity-90"
                />
                <span className="text-xs text-text-muted">PNG, JPEG və ya WEBP — maks 2MB</span>
              </label>
            </div>

            <ThemeColorPicker defaultValue={restaurant?.theme_color ?? "#B48428"} />

            <SubmitButton className="self-start">Yadda saxla</SubmitButton>
          </form>
        )}
      </Card>

      <Card className="max-w-md">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-accent" aria-hidden="true" />
              Ödəniş (Payriff)
            </CardTitle>
            <CardDescription>
              Öz Payriff hesabınızı qoşun — müştəri kartla ödəyəndə pul birbaşa SİZİN hesabınıza düşür, biz heç vaxt vasitəçi
              olmuruq
            </CardDescription>
          </div>
        </CardHeader>

        <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-bg-muted px-3 py-2 text-xs text-text-secondary">
          <ShieldCheck className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          Secret Key şifrələnmiş şəkildə saxlanılır və heç kimə (bizə də) geri göstərilmir — yalnız ödəniş zamanı istifadə olunur.
        </div>

        {context.role !== "owner" ? (
          <p className="text-sm text-text-secondary">Ödəniş parametrlərini yalnız restoran sahibi dəyişə bilər.</p>
        ) : (
          <form action={updatePaymentSettingsAction} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Status:</span>
              {paymentStatus?.is_active && paymentStatus.has_secret ? (
                <Badge variant="success">Aktiv</Badge>
              ) : paymentStatus?.merchant_id || paymentStatus?.has_secret ? (
                <Badge variant="warning">Yarımçıq</Badge>
              ) : (
                <Badge variant="neutral">Qoşulmayıb</Badge>
              )}
            </div>

            <Input
              label="Merchant ID"
              name="merchant_id"
              placeholder="Payriff Applications səhifəsindən"
              defaultValue={paymentStatus?.merchant_id ?? ""}
            />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-text-primary">Secret Key</span>
              <input
                type="password"
                name="secret_key"
                placeholder={paymentStatus?.has_secret ? "•••••••• (dəyişmək üçün yeni açar yazın)" : "Payriff Secret Key"}
                autoComplete="off"
                className="rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
              />
              <span className="text-xs text-text-muted">Boş buraxsanız, əvvəlki açar dəyişmədən qalır</span>
            </label>

            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input type="checkbox" name="is_active" defaultChecked={paymentStatus?.is_active ?? false} className="h-4 w-4 rounded border-border-strong" />
              Kartla ödənişi aktiv et
            </label>

            <SubmitButton className="self-start">Yadda saxla</SubmitButton>
          </form>
        )}
      </Card>

      <Card className="max-w-md">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-accent" aria-hidden="true" />
              Kartdan-karta ödəniş
            </CardTitle>
            <CardDescription>
              Payriff qoşulana qədər (və ya onun əvəzinə) — kart nömrənizi yazın, müştəri "Kartla" seçəndə bu nömrəni görüb öz
              bank tətbiqi ilə köçürmə edir
            </CardDescription>
          </div>
        </CardHeader>

        {context.role !== "owner" ? (
          <p className="text-sm text-text-secondary">Ödəniş parametrlərini yalnız restoran sahibi dəyişə bilər.</p>
        ) : (
          <form action={updateCardTransferAction} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Status:</span>
              {cardTransfer?.is_active && cardTransfer.card_number ? (
                <Badge variant="success">Aktiv</Badge>
              ) : (
                <Badge variant="neutral">Qoşulmayıb</Badge>
              )}
            </div>

            <Input
              label="Kart nömrəsi"
              name="card_number"
              placeholder="0000 0000 0000 0000"
              inputMode="numeric"
              maxLength={19}
              defaultValue={cardTransfer?.card_number ?? ""}
            />
            <Input
              label="Kart sahibinin adı (istəyə bağlı)"
              name="card_holder_name"
              placeholder="Məs. Samir Axundov"
              defaultValue={cardTransfer?.card_holder_name ?? ""}
            />
            <Input
              label="Bank adı (istəyə bağlı)"
              name="bank_name"
              placeholder="Məs. Kapital Bank"
              defaultValue={cardTransfer?.bank_name ?? ""}
            />

            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                name="card_is_active"
                defaultChecked={cardTransfer?.is_active ?? false}
                className="h-4 w-4 rounded border-border-strong"
              />
              Kartdan-karta ödənişi aktiv et
            </label>

            <SubmitButton className="self-start">Yadda saxla</SubmitButton>
          </form>
        )}
      </Card>
    </div>
  );
}
