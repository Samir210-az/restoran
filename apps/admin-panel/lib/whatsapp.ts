const NUMBER = "994552107111";

function link(lines: string[]) {
  return `https://wa.me/${NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

/** Giriş ekranından gələn qeydiyyat müraciəti; sahələri restoran özü doldurur. */
export const registrationRequestUrl = link([
  "Salam! Restoran idarəetmə sisteminə qeydiyyat üçün müraciət edirəm.",
  "",
  "Restoranın adı: ",
  "Restoranın linki (sayt və ya Instagram): ",
  "Şəhər / ünvan: ",
  "Əlaqə nömrəsi: ",
  "",
  "Müraciət mənbəyi: giriş səhifəsi",
]);

/** Abunəliyi dayandırılmış restoranın bərpa müraciəti. */
export const reactivationRequestUrl = link([
  "Salam! Restoranımın abunəliyi dayandırılıb, hesabı bərpa etmək istəyirəm.",
  "",
  "Restoranın adı: ",
  "",
  "Müraciət mənbəyi: dayandırılma səhifəsi",
]);
