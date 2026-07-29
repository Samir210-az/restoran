import { QrCode, Sparkles, CalendarCheck } from "lucide-react";
import { Card, CardTitle, CardDescription, Button } from "@restoran/ui";

export const metadata = { title: "Ana Səhifə" };

/**
 * UI-ONLY: Bu, musteri tetbiqinin qarsilama sehifesinin STRUKTURUDUR.
 * Real restoran/menyu melumati Faza 2-de restaurant slug-a gore
 * dinamik marsrutlasdirma (/[restaurantSlug]) ile qosulacaq.
 */
const ENTRY_POINTS = [
  {
    icon: QrCode,
    title: "QR Menyunu skan edin",
    description: "Masanızdakı QR kodu skan edərək menyuya birbaşa keçin",
  },
  {
    icon: Sparkles,
    title: "AI Ofisiantla söhbət edin",
    description: "Nə istədiyinizi bilmirsiniz? AI köməkçimiz tövsiyə versin",
  },
  {
    icon: CalendarCheck,
    title: "Masa rezerv edin",
    description: "Sevimli restoranınızda yer ayırdın",
  },
] as const;

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden px-4 py-20 text-center md:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgb(var(--accent) / 0.2), transparent 50%)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary md:text-5xl">
            Sifariş vermək heç vaxt bu qədər asan olmayıb
          </h1>
          <p className="mt-4 text-base text-text-secondary md:text-lg">
            QR menyu, ağıllı tövsiyələr və anında sifariş — hamısı bir yerdə
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg">Menyuya bax</Button>
            <Button size="lg" variant="outline">
              Masa rezerv et
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 md:px-6">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {ENTRY_POINTS.map(({ icon: Icon, title, description }) => (
            <Card key={title} variant="glass" className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
