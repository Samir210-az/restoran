import { createSupabasePublicClient } from "@restoran/supabase-client";

export async function submitReview(orderId: string, rating: number, comment?: string): Promise<void> {
  const supabase = createSupabasePublicClient();
  const { error } = await supabase.rpc("submit_review", {
    _order_id: orderId,
    _rating: rating,
    _comment: comment ?? null,
  });

  if (error) {
    if (error.message.startsWith("ALREADY_REVIEWED")) {
      throw new Error("Bu sifariş üçün artıq rəy bildirmisiniz");
    }
    throw new Error("Rəy göndərilmədi, yenidən cəhd edin");
  }
}
