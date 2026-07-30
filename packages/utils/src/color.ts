/**
 * Restoran brendinqi ucun reng koneksiyalari. Design sistemi CSS
 * deyisenleri "R G B" formatinda saxlayir (bax: tokens.css, --accent),
 * ona gore restoranin sahibinin secdiyi HEX rengi (#RRGGBB, <input
 * type="color"> deyeri) bu formata cevirmek lazimdir.
 */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const normalized = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const int = parseInt(normalized, 16);
  if (Number.isNaN(int) || normalized.length !== 6) {
    // Yanlis/bos HEX gelse defolt brend rengine (--accent) geri qayit
    return [180, 132, 40];
  }
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

/** "#B48428" -> "180 132 40" (CSS custom property ucun) */
export function hexToRgbTriplet(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r} ${g} ${b}`;
}

/** Rengi agli terefe qarisdirir - --accent-soft (achiq fon tonu) ucun */
export function lightenRgbTriplet(hex: string, amount = 0.85): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `${mix(r)} ${mix(g)} ${mix(b)}`;
}

/** Rengin parlaqligina gore ag ve ya tund metn secir - --accent-foreground ucun (WCAG-a yaxin) */
export function contrastForegroundRgbTriplet(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "24 24 27" : "255 255 255";
}
