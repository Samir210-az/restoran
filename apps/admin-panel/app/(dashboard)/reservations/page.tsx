import { CalendarCheck } from "lucide-react";
import { Card } from "@restoran/ui";
import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { ReservationRow } from "@/components/reservations/ReservationRow";

export const metadata = { title: "Rezervasiyalar" };

export default async function ReservationsPage() {
  const { restaurantId } = await getCurrentStaffContext();
  const supabase = getSupabaseServerClient();

  const [{ data: reservations }, { data: tables }] = await Promise.all([
    supabase
      .from("reservations")
      .select("id, customer_name, customer_phone, party_size, reserved_at, status, notes")
      .eq("restaurant_id", restaurantId)
      .order("reserved_at", { ascending: true })
      .limit(100),
    supabase.from("restaurant_tables").select("id, table_number").eq("restaurant_id", restaurantId).eq("status", "free"),
  ]);

  const rows = reservations ?? [];
  const tableOptions = tables ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Rezervasiyalar</h1>
        <p className="text-sm text-text-secondary">Müştəri sorğuları və masa təhkimi</p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <CalendarCheck className="h-8 w-8 text-text-muted" aria-hidden="true" />
            <p className="text-sm text-text-secondary">Hələ rezervasiya yoxdur</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <ReservationRow key={r.id} reservation={r} tables={tableOptions} />
          ))}
        </div>
      )}
    </div>
  );
}
