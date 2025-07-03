export interface OrderData {
  orderId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  totalAmount: number;
  customerEmail: string;
}

export interface InventoryItem {
  productId: string;
  quantity: number;
  price: number;
}