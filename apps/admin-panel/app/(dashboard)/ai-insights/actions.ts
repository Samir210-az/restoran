"use server";

import { getCurrentStaffContext } from "@/lib/get-current-staff-context";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { logger } from "@restoran/utils";

/**
 * FAZA 10: AI Biznes Kesfiyyati.
 *
 * Iki qatli tehlukesizlik: (1) bu action ozu owner/manager olmayanlari
 * derhal rədd edir, (2) `get_business_snapshot` RPC-si DB terefinde
 * `can_view_business_insights()` ile eyni yoxlamani TEKRAR aparir (defense
 * in depth - birbasa RPC-ye kimse basqa yoldan cagirsa belə qorunur).
 *
 * AI-nin reqem UYDURMASININ QARSISINI ALMAQ ucun: butun cemler/ortalar/
 * sira ile duzme Postgres-de (`get_business_snapshot`) hesablanir, Groq-a
 * YALNIZ hazir JSON-u sherh etmek tapsirigi verilir - AI Ofisiant-daki
 * "yalniz real menyudan tovsiye et" prinsipinin analitika ucun ekvivalenti.
 */

interface InsightSnapshot {
  period_days: number;
  generated_at: string;
  revenue: { current_total: number; previous_total: number; order_count: number };
  top_selling_items: { name: string; quantity_sold: number; revenue: number }[];
  slow_moving_items: { name: string; quantity_sold: number }[];
  orders_by_status: Record<string, number>;
  low_stock_items: { name: string; current_stock: number; unit: string; low_stock_threshold: number }[];
  customers: { total_customers: number; avg_total_spent: number; total_loyalty_points_outstanding: number };
  reviews: { review_count: number; avg_rating: number };
  active_staff_by_role: Record<string, number>;
  upcoming_reservations: number;
}

export type AskInsightResult = { reply: string; snapshot: InsightSnapshot } | { error: string };

export async function askBusinessInsightAction(question: string, days = 30): Promise<AskInsightResult> {
  const context = await getCurrentStaffContext();

  if (context.role !== "owner" && context.role !== "manager") {
    return { error: "Bu bölmə yalnız restoran sahibi və menecerlər üçündür" };
  }

  const trimmedQuestion = question.trim();
  if (!trimmedQuestion || trimmedQuestion.length > 500) {
    return { error: "Sual boş ola bilməz və 500 simvoldan uzun olmamalıdır" };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.error("GROQ_API_KEY qurulmayıb (admin-panel)");
    return { error: "AI Kəşfiyyat hələ konfiqurasiya olunmayıb — GROQ_API_KEY tələb olunur" };
  }

  const supabase = getSupabaseServerClient();
  const { data: snapshot, error: snapshotError } = await (
    supabase as unknown as {
      rpc: (fn: string, args: unknown) => Promise<{ data: InsightSnapshot | null; error: { message: string } | null }>;
    }
  ).rpc("get_business_snapshot", { _restaurant_id: context.restaurantId, _days: days });

  if (snapshotError || !snapshot) {
    logger.error("get_business_snapshot xətası", { message: snapshotError?.message });
    return { error: "Biznes məlumatları gətirilə bilmədi" };
  }

  const revenueChangePct =
    snapshot.revenue.previous_total > 0
      ? (((snapshot.revenue.current_total - snapshot.revenue.previous_total) / snapshot.revenue.previous_total) * 100).toFixed(1)
      : null;

  const systemPrompt = `Sən "${context.restaurantName}" restoranının AI Biznes Kəşfiyyat analitikisən. Restoran sahibi/meneceri ilə Azərbaycan dilində danışırsan.

QAYDALAR:
- YALNIZ aşağıdakı real JSON məlumatlarından istifadə et. Rəqəm UYDURMA, əlində olmayan məlumat üçün "bu barədə məlumat yoxdur" de.
- Qısa və konkret cavab ver (maksimum 4-5 cümlə və ya bir neçə bənd), lazım olanda rəqəmləri qeyd et.
- Pul məbləğlərini "₼" işarəsi ilə göstər.
- Mümkünsə, rəqəmlərin arxasında nə demək olduğunu izah et (məs. "aşağı düşüb" yerinə niyə vacib olduğunu qısa vur).
- Sən məsləhət verə bilərsən, amma bunun tövsiyə olduğunu aydın et — əmr kimi yox.

SON ${days} GÜNÜN JSON MƏLUMATLARI:
${JSON.stringify(snapshot)}

${revenueChangePct !== null ? `(Qeyd: gəlir əvvəlki ${days} günə nisbətən ${revenueChangePct}% dəyişib — bunu özün hesabla, JSON-dakı current_total/previous_total-dan.)` : ""}`;

  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: trimmedQuestion },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      logger.error("Groq API xətası (insights)", { status: groqResponse.status, body: errText.slice(0, 300) });
      return { error: "AI cavab verə bilmədi, bir az sonra yenidən cəhd edin" };
    }

    const data = await groqResponse.json();
    const reply: string = data.choices?.[0]?.message?.content ?? "Üzr istəyirəm, cavab verə bilmədim.";

    return { reply, snapshot };
  } catch (err) {
    logger.error("AI insights action xətası", { message: err instanceof Error ? err.message : String(err) });
    return { error: "Gözlənilməz xəta baş verdi" };
  }
}
