import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, Badge, Input, Button } from "@restoran/ui";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getOpenShift, getRecentShifts, getShiftTotals } from "@/lib/cash-shift";
import { openShiftAction, closeShiftAction } from "./actions";

export const metadata = { title: "Kassa növbəsi" };

const money = (value: number) => `${value.toFixed(2)} ₼`;
const when = (iso: string) =>
  new Date(iso).toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default async function CashPage({ searchParams }: { searchParams: { error?: string; saved?: string } }) {
  const { restaurantId, role } = await getCurrentStaffContext();
  if (role !== "owner" && role !== "manager" && role !== "cashier") redirect("/dashboard");

  const shift = await getOpenShift(restaurantId);
  const totals = shift ? await getShiftTotals(restaurantId, shift.opened_at) : null;
  const history = await getRecentShifts(restaurantId);
  const expected = shift && totals ? Number(shift.opening_cash) + totals.cash + totals.cashTips - totals.tipPayouts : 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      {searchParams.error && <Card className="border-danger/40 text-sm text-danger">{searchParams.error}</Card>}
      {searchParams.saved && <Card className="border-success/40 text-sm text-success">{searchParams.saved}</Card>}

      {!shift && (
        <Card>
          <CardHeader>
            <CardTitle>Növbəni aç</CardTitle>
            <CardDescription>Kassada hazırda olan nağd pulu yazın. Günün sonunda hesabat bundan hesablanır.</CardDescription>
          </CardHeader>
          <form action={openShiftAction} className="flex flex-col gap-3">
            <Input name="opening_cash" type="number" inputMode="decimal" step="0.01" min="0" defaultValue="0" required aria-label="Başlanğıc nağd məbləğ" />
            <Button type="submit">Növbəni aç</Button>
          </form>
        </Card>
      )}

      {shift && totals && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Açıq növbə</CardTitle>
              <CardDescription>
                {shift.opened_by_name ?? "Kassir"} · {when(shift.opened_at)} · {totals.orderCount} ödənilmiş sifariş
              </CardDescription>
            </CardHeader>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-text-secondary">Başlanğıc nağd</dt><dd className="font-semibold">{money(Number(shift.opening_cash))}</dd></div>
              <div><dt className="text-text-secondary">Nağd satış</dt><dd className="font-semibold">{money(totals.cash)}</dd></div>
              <div><dt className="text-text-secondary">Kartla</dt><dd className="font-semibold">{money(totals.card)}</dd></div>
              <div><dt className="text-text-secondary">Onlayn</dt><dd className="font-semibold">{money(totals.online)}</dd></div>
            </dl>
            <p className="mt-3 border-t border-border pt-3 text-sm">
              Kassada olmalı olan nağd: <span className="font-semibold">{money(expected)}</span>
              {totals.cashTips > 0 && <span className="text-text-secondary"> (nağd çay pulu {money(totals.cashTips)} daxildir)</span>}
              {totals.tipPayouts > 0 && <span className="text-text-secondary"> (ofisiantlara verilən {money(totals.tipPayouts)} çıxılıb)</span>}
            </p>
            {totals.tipsByWaiter.length > 0 && (
              <div className="mt-3 text-sm">
                <p className="text-text-secondary">
                  Çay pulu (gəlirə daxil deyil): nağd {money(totals.cashTips)}, kartla {money(totals.cardTips)}. Ofisiantlar üzrə:
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {totals.tipsByWaiter.map((t) => (
                    <li key={t.name} className="flex justify-between"><span>{t.name}</span><span className="font-medium">{money(t.amount)}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {totals.courierCash.length > 0 && (
              <div className="mt-3 text-sm">
                <p className="text-text-secondary">Kuryerlərdən təhvil alınmalı nağd (bu məbləğ yuxarıdakı nağda daxildir):</p>
                <ul className="mt-1 flex flex-col gap-1">
                  {totals.courierCash.map((c) => (
                    <li key={c.name} className="flex justify-between"><span>{c.name}</span><span className="font-medium">{money(c.amount)}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Növbəni bağla</CardTitle>
              <CardDescription>Kassadakı pulu sayın və real məbləği yazın. Fərq avtomatik göstəriləcək.</CardDescription>
            </CardHeader>
            <form action={closeShiftAction} className="flex flex-col gap-3">
              <Input name="counted_cash" type="number" inputMode="decimal" step="0.01" min="0" required placeholder="Saydığınız nağd" aria-label="Saydığınız nağd məbləğ" />
              <Input name="note" placeholder="Qeyd (fərq varsa səbəbi)" maxLength={300} aria-label="Qeyd" />
              <Button type="submit" variant="outline">Növbəni bağla</Button>
            </form>
          </Card>
        </>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Son növbələr</CardTitle></CardHeader>
          <ul className="flex flex-col divide-y divide-border text-sm">
            {history.map((s) => {
              const diff = Number(s.counted_cash ?? 0) - Number(s.expected_cash ?? 0);
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div>
                    <p className="font-medium">{when(s.opened_at)} – {s.closed_at ? when(s.closed_at) : ""}</p>
                    <p className="text-text-secondary">{s.closed_by_name ?? s.opened_by_name} · gözlənilən {money(Number(s.expected_cash ?? 0))} · sayılan {money(Number(s.counted_cash ?? 0))}</p>
                    {s.note && <p className="text-text-secondary">{s.note}</p>}
                  </div>
                  <Badge variant={Math.abs(diff) < 0.005 ? "success" : diff < 0 ? "danger" : "warning"}>
                    {Math.abs(diff) < 0.005 ? "Düz çıxdı" : `${diff > 0 ? "+" : ""}${money(diff)}`}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
