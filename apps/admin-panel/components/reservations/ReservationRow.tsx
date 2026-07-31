"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge, Button } from "@restoran/ui";
import { ClipboardList } from "lucide-react";
import {
  confirmReservationAction,
  seatReservationAction,
  cancelReservationAction,
  markNoShowAction,
} from "@/app/(dashboard)/reservations/actions";

interface TableOption {
  id: string;
  table_number: string;
}

interface ReservationRowProps {
  reservation: {
    id: string;
    customer_name: string;
    customer_phone: string;
    party_size: number;
    reserved_at: string;
    status: string;
    notes: string | null;
  };
  tables: TableOption[];
}

const STATUS_BADGE: Record<string, "neutral" | "warning" | "success" | "danger" | "info"> = {
  pending: "warning",
  confirmed: "info",
  seated: "success",
  cancelled: "danger",
  no_show: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Gözləyir",
  confirmed: "Təsdiqləndi",
  seated: "Oturdu",
  cancelled: "Ləğv edilib",
  no_show: "Gəlmədi",
};

export function ReservationRow({ reservation, tables }: ReservationRowProps) {
  const [selectedTable, setSelectedTable] = useState(tables[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  /**
   * "Oturt" ARTIQ sadece statusu deyisdirmir - masa secilibse, isciyi
   * DERHAL o masa ucun sifariş formasina (order-new) aparir. Evvelki
   * versiyada "Oturt" yalniz bir etiket deyisikliyi idi, HEC bir real
   * neticesi (sifariş, masa mesguliyyeti) olmurdu - musteri gercekden
   * "oturmurdu", ona gore masa hemise (yanlis olaraq) bos gorunurdu.
   */
  function handleSeat() {
    startTransition(async () => {
      await seatReservationAction(reservation.id, selectedTable || null);
      if (selectedTable) {
        router.push(`/order-new?table=${selectedTable}`);
      } else {
        router.refresh();
      }
    });
  }

  const reservedAt = new Date(reservation.reserved_at);
  const formattedTime = reservedAt.toLocaleString("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium text-text-primary">{reservation.customer_name}</p>
          <Badge variant={STATUS_BADGE[reservation.status] ?? "neutral"}>
            {STATUS_LABEL[reservation.status] ?? reservation.status}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          {formattedTime} · {reservation.party_size} nəfər · {reservation.customer_phone}
        </p>
        {reservation.notes && <p className="mt-1 text-xs text-text-muted">{reservation.notes}</p>}
      </div>

      {(reservation.status === "pending" || reservation.status === "confirmed") && (
        <div className="flex flex-wrap items-center gap-2">
          {reservation.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => startTransition(async () => {
                await confirmReservationAction(reservation.id);
                router.refresh();
              })}
            >
              Təsdiqlə
            </Button>
          )}

          {tables.length > 0 && (
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="h-8 rounded-md border border-border-strong bg-bg px-2 text-xs text-text-primary"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Masa {t.table_number}
                </option>
              ))}
            </select>
          )}
          <Button size="sm" disabled={isPending} onClick={handleSeat}>
            <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
            {selectedTable ? "Otur, sifariş al" : "Oturt"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => startTransition(async () => {
              await markNoShowAction(reservation.id);
              router.refresh();
            })}
          >
            Gəlmədi
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={isPending}
            onClick={() => startTransition(async () => {
              await cancelReservationAction(reservation.id);
              router.refresh();
            })}
          >
            Ləğv et
          </Button>
        </div>
      )}
    </Card>
  );
}
