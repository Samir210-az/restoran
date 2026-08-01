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
 * Cihaz-restoran baglanmasi ucun asan yazila bilen, amma тахмин
 * edilmesi cetin restoran girish kodu (bax: RestaurantPicker).
 * Qarisdirila bilen simvollar (0/O, 1/I) qesden cixarilib.
 */
const ACCESS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateAccessCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ACCESS_CODE_ALPHABET[Math.floor(Math.random() * ACCESS_CODE_ALPHABET.length)];
  }
  return code;
}
