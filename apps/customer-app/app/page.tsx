export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { UtensilsCrossed } from "lucide-react";
import { createSupabasePublicClient } from "@restoran/supabase-client";

export const metadata = { title: "Restoranlar" };

interface DirectoryRestaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  theme_color: string;
}

/**
 * Platformanin restoran DIREKTORISI. Kod terefinde "hansi restoran"
 * secimi yoxdu ideyasi burada aradan qalxir - musteri bas sehifeye
 * girende butun aktiv/trial restoranlari loqo+ad kimi gorur, birine
 * tiklayanda o restoranin oz [slug] sehifesine kecir (bax: SAD).
 *
 * `get_public_restaurant_directory` RPC-si YALNIZ hessas olmayan
 * sutunlari (id/name/slug/logo/tema) qaytarir - owner_id, plan kimi
 * melumatlar burada YOXDUR.
 */
async function getRestaurants(): Promise<DirectoryRestaurant[]> {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase.rpc("get_public_restaurant_directory");
  return data ?? [];
}

export default async function HomePage() {
  const restaurants = await getRestaurants();

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden px-4 py-16 text-center md:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(circle at 50% 0%, rgb(var(--accent) / 0.2), transparent 50%)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary md:text-5xl">
            Sevimli restoranınızı seçin
          </h1>
          <p className="mt-4 text-base text-text-secondary md:text-lg">
            QR menyu, ağıllı tövsiyələr və anında sifariş — hamısı bir yerdə
          </p>
        </div>
      </section>

      <section className="px-4 pb-20 md:px-6">
        {restaurants.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <UtensilsCrossed className="mx-auto h-10 w-10 text-text-muted" aria-hidden="true" />
            <p className="mt-3 text-sm text-text-secondary">Hələ heç bir restoran qeydiyyatdan keçməyib</p>
          </div>
        ) : (
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {restaurants.map((r) => (
              <Link
                key={r.id}
                href={`/${r.slug}`}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-bg-elevated p-4 text-center shadow-soft transition-transform hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div
                  className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg"
                  style={{ backgroundColor: `${r.theme_color}1a` }}
                >
                  {r.logo_url ? (
                    <Image
                      src={r.logo_url}
                      alt={r.name}
                      width={160}
                      height={160}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-semibold" style={{ color: r.theme_color }}>
                      {r.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="line-clamp-2 text-sm font-medium text-text-primary group-hover:text-accent">
                  {r.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
