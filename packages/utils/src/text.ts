export type LocalizedRecord = Partial<Record<"az" | "en" | "ru", string>>;

/**
 * Coxdilli jsonb sahelerini (menu_categories.name ve s.) teqdimat ucun
 * tek stringe cevirir. Sira ile: istenilen dil -> az -> ilk movcud deyer.
 */
export function localize(text: LocalizedRecord | null | undefined, lang: "az" | "en" | "ru" = "az"): string {
  if (!text) return "";
  return text[lang] || text.az || Object.values(text).find(Boolean) || "";
}
