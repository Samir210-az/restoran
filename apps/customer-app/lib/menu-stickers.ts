const AZ_MAP: Record<string, string> = {
  "ə": "e",
  "ı": "i",
  "ö": "o",
  "ü": "u",
  "ş": "s",
  "ç": "c",
  "ğ": "g",
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[əıöüşçğ]/g, (ch) => AZ_MAP[ch] ?? ch);
}

// Sıra vacibdir: konkret açar sözlər (şampan, brauni) ümumi olanlardan (çay, şirniyyat) əvvəl gəlir.
const RULES: { keywords: string[]; stickers: string[] }[] = [
  { keywords: ["sampan", "champagne"], stickers: ["champagne-bucket", "champagne-tray", "champagne-roses", "ring-box-champagne"] },
  { keywords: ["konyak", "cognac", "viski", "whisky"], stickers: ["cognac-ice", "cognac-coffee"] },
  { keywords: ["sarab", "vino", "wine"], stickers: ["wine-basket", "wine-cheese-basket"] },
  {
    keywords: ["kokteyl", "cocktail", "limonad", "kompot", "sire", "naric", "meyve sirəsi", "icki"],
    stickers: ["strawberry-cocktail", "strawberry-drink"],
  },
  { keywords: ["kapucino", "cappuccino", "latte"], stickers: ["cappuccino"] },
  { keywords: ["espresso", "amerikano", "kofe", "qehve", "coffee"], stickers: ["coffee-cup", "coffee-splash", "cappuccino"] },
  { keywords: ["brauni", "brownie", "sokolad", "chocolate"], stickers: ["brownies-tea", "tea-brownie", "chocolate-roses"] },
  {
    keywords: ["tort", "cizkeyk", "cheesecake", "pirojna", "kek", "desert", "dessert", "sirniyyat", "sirin"],
    stickers: ["strawberry-sponge", "cake-stand", "dessert-plate-a", "dessert-plate-b", "scones-plate", "cookies-napkin"],
  },
  { keywords: ["cay", "tea"], stickers: ["teapot-iron", "tea-raspberry", "tea-cup-red", "teapot-cupcakes", "tea-set-bread", "teapot-gnomes", "teapot-brownies", "tea-champagne"] },
  { keywords: ["pizza"], stickers: ["pizza"] },
  { keywords: ["seher yemeyi", "breakfast", "sahan"], stickers: ["breakfast-plate", "breakfast-tray"] },
  { keywords: ["yumurta", "omlet"], stickers: ["fried-egg", "eggs-basket", "broken-egg", "egg-a", "egg-b", "egg-c"] },
  { keywords: ["kruasan", "croissant"], stickers: ["croissant"] },
  { keywords: ["corek", "bulka", "xemir", "pide", "pirojki"], stickers: ["bread-basket", "bread-board", "buns", "kugelhopf"] },
  { keywords: ["pendir", "cheese"], stickers: ["cheese"] },
  { keywords: ["kolbasa", "sosis", "sucuk"], stickers: ["sausages"] },
  { keywords: ["toyuq", "chicken", "qizardilmis", "kfc"], stickers: ["fried-chicken"] },
  {
    keywords: ["kabab", "kebab", "lule", "sasliq", "dolma", "plov", "xash", "sorba", "dovga", "qutab", "qovurma", "quzu", "qoyun"],
    stickers: ["bread-basket", "salad-bowl", "pickles", "onion-rings"],
  },
  { keywords: ["sogan halqa", "onion ring"], stickers: ["onion-rings"] },
  { keywords: ["salat", "salad"], stickers: ["salad-bowl"] },
  { keywords: ["tursu", "konserv"], stickers: ["pickles"] },
  { keywords: ["murebbe"], stickers: ["jam-jars"] },
  { keywords: ["buxar", "dim sum", "dimsum", "wok", "terevez"], stickers: ["steamer-veg"] },
  { keywords: ["soya", "tofu"], stickers: ["soy-products"] },
  { keywords: ["seker", "sugar"], stickers: ["sugar-bowl"] },
  { keywords: ["zeytun yagi", "olive oil", "yag"], stickers: ["olive-oil"] },
  { keywords: ["meyve", "fruit"], stickers: ["fruit-bowl"] },
];

// Söz açar sözlə başlayır və sonuna ən çoxu 3 hərf (şəkilçi) əlavə olunur: "çaylar", "desertlər" uyğundur, "tortilla" yox.
const MAX_SUFFIX = 3;

function matches(text: string, keyword: string): boolean {
  const key = normalize(keyword);
  if (key.includes(" ")) return text.includes(key);
  return text
    .split(/[^a-z0-9]+/)
    .some((word) => word.startsWith(key) && word.length - key.length <= MAX_SUFFIX);
}

// Açar söz tapılmayan məhsullar boş qalmasın deyə neytral yemək stikerləri.
const FALLBACK_STICKERS = ["bread-basket", "salad-bowl", "breakfast-tray", "fruit-bowl"];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Yeməyin adına, sonra kateqoriya adına görə uyğun stiker seçir.
 * Eyni məhsul həmişə eyni stikeri alır (seed = məhsulun id-si), eyni növdən
 * bir neçə məhsul isə fərqli stiker göstərə bilər. Uyğun açar söz tapılmasa
 * neytral ehtiyat stikerlərindən biri seçilir, ona görə stikersiz məhsul qalmır.
 */
export function pickMenuSticker(itemName: string, categoryName: string | undefined, seed: string): string {
  for (const source of [itemName, categoryName ?? ""]) {
    const text = normalize(source);
    if (!text) continue;
    const rule = RULES.find((r) => r.keywords.some((k) => matches(text, k)));
    if (rule) return rule.stickers[hashSeed(seed) % rule.stickers.length];
  }
  return FALLBACK_STICKERS[hashSeed(seed) % FALLBACK_STICKERS.length];
}
