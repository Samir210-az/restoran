export type SubscriptionPlan = "free" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "trial" | "suspended" | "cancelled";
export type SupportedLanguage = "az" | "en" | "ru";

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  defaultLanguage: SupportedLanguage;
  timezone: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  restaurantId: string;
  name: string;
  address: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  isActive: boolean;
}

export interface StaffMember {
  id: string;
  userId: string;
  restaurantId: string;
  branchId: string | null;
  role: import("./roles").StaffRole;
  isActive: boolean;
  hiredAt: string;
}
