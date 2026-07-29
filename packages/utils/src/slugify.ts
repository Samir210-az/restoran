/**
 * Restoran adindan URL-safe slug yaradir (meselen QR menyu linki ucun:
 * restoran.app/lezzet-sarayi). Azerbaycan hərflərini latın ekvivalentinə çevirir.
 */
const AZ_CHAR_MAP: Record<string, string> = {
  ə: "e", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", ç: "c",
  Ə: "e", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u", Ç: "c",
};

export function slugify(input: string): string {
  const transliterated = input
    .split("")
    .map((ch) => AZ_CHAR_MAP[ch] ?? ch)
    .join("");

  return transliterated
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
