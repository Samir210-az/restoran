export type OrderType = "dine_in" | "takeaway" | "delivery";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";
export type OrderPlacedBy = "customer" | "waiter" | "ai_waiter";

export interface Order {
  id: string;
  restaurantId: string;
  branchId: string;
  tableId: string | null;
  customerId: string | null;
  orderType: OrderType;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  placedBy: OrderPlacedBy;
  createdAt: string;
}
