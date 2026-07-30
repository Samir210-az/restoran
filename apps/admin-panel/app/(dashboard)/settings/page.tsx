import { Palette, ImageIcon, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@restoran/ui";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { ThemeColorPicker } from "@/components/settings/ThemeColorPicker";
import { updateRestaurantBrandingAction } from "./actions";

export const metadata = { title: "Parametrlər" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const context = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name, slug, logo_url, theme_color")
    .eq("id", context.restaurantId)
    .maybeSingle();

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
    </div>
  );
}
