/**
 * Restoran adindan URL-safe slug yaradir. Azerbaycan herflerini de
 * duzgun transliterasiya edir (meselen "Ləzzət Sarayı" -> "lezzet-sarayi").
 */
const AZ_TRANSLITERATION: Record<string, string> = {
  ə: "e", Ə: "e",
  ğ: "g", Ğ: "g",
  ı: "i", I: "i",
  İ: "i",
  ö: "o", Ö: "o",
  ş: "s", Ş: "s",
  ü: "u", Ü: "u",
  ç: "c", Ç: "c",
};

export function slugify(input: string): string {
  const transliterated = input
    .split("")
    .map((char) => AZ_TRANSLITERATION[char] ?? char)
    .join("");

  return transliterated
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Slug-a tesadufi 4 simvol elave edir - eyni adli iki restoran
 * qeydiyyatdan kecende toqqusmani (collision) qarsisini alir.
 */
export function slugifyUnique(input: string): string {
  const base = slugify(input);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
