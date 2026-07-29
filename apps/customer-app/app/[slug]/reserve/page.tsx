import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createSupabasePublicClient } from "@restoran/supabase-client";
import { ReservationForm } from "@/components/reservation/ReservationForm";

interface PageProps {
  params: { slug: string };
}

export const metadata: Metadata = { title: "Masa rezerv edin" };

export default async function ReservePage({ params }: PageProps) {
  const supabase = createSupabasePublicClient();
  const { data: rows } = await supabase.rpc("get_public_restaurant_by_slug", { _slug: params.slug });
  const restaurant = rows?.[0];
  if (!restaurant) notFound();

  return (
    <div className="px-4 py-8">
      <ReservationForm restaurant={restaurant} />
    </div>
  );
}
