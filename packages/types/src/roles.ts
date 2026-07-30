/**
 * Platforma daxilindeki butun rol tipleri.
 * SAD (Software Architecture Document) bolme 6 ile bire-bir uygun olmalidir.
 */
export type StaffRole = "owner" | "manager" | "cashier" | "chef" | "waiter" | "courier";
export type PlatformRole = "platform_admin";
export type AppRole = PlatformRole | StaffRole | "customer";

export const STAFF_ROLES: StaffRole[] = [
  "owner",
  "manager",
  "cashier",
  "chef",
  "waiter",
  "courier",
];

export const ROLE_LABELS: Record<AppRole, { az: string; en: string; ru: string }> = {
  platform_admin: { az: "Platforma Admini", en: "Platform Admin", ru: "Администратор платформы" },
  owner: { az: "Sahib", en: "Owner", ru: "Владелец" },
  manager: { az: "Menecer", en: "Manager", ru: "Менеджер" },
  cashier: { az: "Kassir", en: "Cashier", ru: "Кассир" },
  chef: { az: "Aşpaz", en: "Chef", ru: "Шеф-повар" },
  waiter: { az: "Ofisiant", en: "Waiter", ru: "Официант" },
  courier: { az: "Kuryer", en: "Courier", ru: "Курьер" },
  customer: { az: "Müştəri", en: "Customer", ru: "Клиент" },
};
