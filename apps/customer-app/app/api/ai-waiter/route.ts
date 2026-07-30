import { NextResponse } from "next/server";
import { createSupabasePublicClient } from "@restoran/supabase-client";
import { logger } from "@restoran/utils";

/**
 * AI Ofisiant - Route Handler (server-terefi, Edge/Node runtime).
 * GROQ_API_KEY BURADA, YALNIZ SERVERDE oxunur - `.env.local`-da
 * NEXT_PUBLIC_ prefiksi YOXDUR, ona gore Next.js onu browser bundle-ina
 * QOYMUR. Musteri browseri bu route-u cagirir, acari heç vaxt görmür.
 */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface LocalizedText {
  az?: string;
}

export async function POST(request: Request) {
  try {
    const { restaurantId, messages } = (await request.json()) as {
      restaurantId: string;
      messages: ChatMessage[];
    };

    if (!restaurantId || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      logger.error("GROQ_API_KEY qurulmayıb");
      return NextResponse.json({ error: "AI_NOT_CONFIGURED" }, { status: 503 });
    }

    // Menyunu SERVERDE gətiririk ki, AI YALNIZ real mövcud yeməklərdən
    // tövsiyə versin - uydurma yemək/qiymət söyləməsin (bax: SAD bölmə 8).
    const supabase = createSupabasePublicClient();
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("name")
      .eq("id", restaurantId)
      .maybeSingle();

    const { data: items } = await supabase
      .from("menu_items")
      .select("name, description, price, is_available")
      .eq("restaurant_id", restaurantId)
      .eq("is_available", true);

    const menuText = (items ?? [])
      .map((item) => {
        const name = (item.name as LocalizedText)?.az ?? "";
        const desc = (item.description as LocalizedText)?.az ?? "";
        return `- ${name}${desc ? ` (${desc})` : ""} — ${Number(item.price).toFixed(2)} ₼`;
      })
      .join("\n");

    const systemPrompt = `Sən "${restaurant?.name ?? "Restoran"}" adlı restoranın AI ofisiantısan. Azərbaycan dilində, isti, səmimi və gülərüz bir tonla, qısa (2-4 cümlə) cavab ver.

QAYDALAR:
- HƏR CAVABIN "Hörmətli müştəri," sözü ilə BAŞLAMALIDIR (məsələn: "Hörmətli müştəri, əlbəttə! ...").
- Tonun mehriban, isti və qonaqpərvər olsun — sanki əziz qonağı qarşılayan bir ofisiantsan. Münasib yerlərdə təbəssüm bildirən bir emoji (😊, 👋, 🍽️) istifadə edə bilərsən, amma hər cümlədə deyil.
- YALNIZ aşağıdakı real menyudan tövsiyə et. Menyuda olmayan yemək UYDURMA.
- Qiymətləri dəqiq bu siyahıdan göstər, öz başına qiymət uydurma.
- Müştəri nə istədiyini bilmirsə, zövqünə görə (məs. ət/toyuq/vegetarian, acılı/şirin) sual ver.
- Sifarişi sən özün vermirsən - müştəriyə "səbətə əlavə et" düyməsini göstər, sən sadəcə tövsiyə verirsən.

MENYU:
${menuText || "(hələ yemək əlavə olunmayıb)"}`;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.6,
        max_tokens: 400,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      logger.error("Groq API xətası", { status: groqResponse.status, body: errText.slice(0, 300) });
      return NextResponse.json({ error: "AI_PROVIDER_ERROR" }, { status: 502 });
    }

    const data = await groqResponse.json();
    const reply: string = data.choices?.[0]?.message?.content ?? "Hörmətli müştəri, üzr istəyirəm, hazırda cavab verə bilmədim. Bir az sonra yenidən cəhd edin. 🙏";

    return NextResponse.json({ reply });
  } catch (err) {
    logger.error("AI waiter route xətası", { message: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
