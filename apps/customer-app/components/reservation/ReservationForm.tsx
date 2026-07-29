"use client";

import { useState } from "react";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import { Card, Input, Button } from "@restoran/ui";
import { requestReservation } from "@/lib/request-reservation";

export function ReservationForm({ restaurant }: { restaurant: { id: string; name: string } }) {
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const date = String(formData.get("date") ?? "");
    const time = String(formData.get("time") ?? "");

    try {
      await requestReservation({
        restaurantId: restaurant.id,
        customerName: String(formData.get("name") ?? "").trim(),
        customerPhone: String(formData.get("phone") ?? "").trim(),
        partySize: Number(formData.get("party_size") ?? 2),
        reservedAt: date && time ? new Date(`${date}T${time}`).toISOString() : "",
        notes: String(formData.get("notes") ?? "").trim() || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setSubmitting(false);
    }
  }

  if (isDone) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-success" aria-hidden="true" />
        <p className="font-medium text-text-primary">Sorğunuz göndərildi</p>
        <p className="mt-1 text-sm text-text-secondary">
          {restaurant.name} sizinlə tezliklə əlaqə saxlayıb rezervasiyanızı təsdiqləyəcək
        </p>
      </Card>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <Card className="mx-auto max-w-md">
      <div className="mb-4 flex items-center gap-2">
        <CalendarCheck className="h-5 w-5 text-accent" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-text-primary">Masa rezerv edin</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Adınız" name="name" required autoFocus />
        <Input label="Telefon nömrəniz" name="phone" type="tel" required />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Tarix" name="date" type="date" min={today} required />
          <Input label="Saat" name="time" type="time" required />
        </div>
        <Input label="Nəfər sayı" name="party_size" type="number" min="1" defaultValue={2} required />
        <Input label="Qeyd (istəyə bağlı)" name="notes" placeholder="Məs. pəncərə kənarı" />

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="w-full" size="lg">
          Sorğu göndər
        </Button>
      </form>
    </Card>
  );
}
