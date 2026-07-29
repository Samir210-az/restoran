export type LocalizedText = Record<import("./tenant").SupportedLanguage, string>;

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: LocalizedText;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  restaurantId: string;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  prepTimeMinutes: number | null;
  calories: number | null;
  allergens: string[];
  tags: string[];
}
