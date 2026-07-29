export type LocalizedRecord = Partial<Record<"az" | "en" | "ru", string>>;

/**
 * Coxdilli jsonb sahelerini (menu_categories.name ve s.) teqdimat ucun
 * tek stringe cevirir. Sira ile: istenilen dil -> az -> ilk movcud deyer.
 */
export function localize(text: LocalizedRecord | null | undefined, lang: "az" | "en" | "ru" = "az"): string {
  if (!text) return "";
  return text[lang] || text.az || Object.values(text).find(Boolean) || "";
}

/**
 * Restoran adindan URL-safe slug yaradir. Azerbaycan herflerini de
 * duzgun translit edir (meselen "Ləzzət" -> "lezzet").
 */
export function slugify(input: string): string {
  const AZ_MAP: Record<string, string> = {
    ə: "e", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", ç: "c",
    Ə: "e", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u", Ç: "c",
  };
  const translited = input
    .split("")
    .map((ch) => AZ_MAP[ch] ?? ch)
    .join("");

  return translited
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}
