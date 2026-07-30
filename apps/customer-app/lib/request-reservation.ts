import { createSupabasePublicClient } from "@restoran/supabase-client";

export interface RequestReservationParams {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservedAt: string; // ISO datetime
  notes?: string;
}

export async function requestReservation(params: RequestReservationParams): Promise<string> {
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase.rpc("request_reservation", {
    _restaurant_id: params.restaurantId,
    _customer_name: params.customerName,
    _customer_phone: params.customerPhone,
    _party_size: params.partySize,
    _reserved_at: params.reservedAt,
    _notes: params.notes ?? undefined,
  });

  if (error) {
    const known: Record<string, string> = {
      INVALID_PARTY_SIZE: "Nəfər sayını düzgün daxil edin",
      INVALID_TIME: "Zəhmət olmasa gələcək bir tarix/saat seçin",
      MISSING_CONTACT: "Ad və telefon nömrəsi tələb olunur",
      RESTAURANT_UNAVAILABLE: "Bu restoran hazırda rezervasiya qəbul etmir",
    };
    const code = Object.keys(known).find((k) => error.message.startsWith(k));
    throw new Error(code ? known[code] : "Rezervasiya göndərilmədi, yenidən cəhd edin");
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row.reservation_id;
}
