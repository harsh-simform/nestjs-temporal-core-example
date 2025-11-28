export interface InventoryItem {
  productId: string;
  quantity: number;
}

export interface InventoryCheckResult {
  productId: string;
  available: boolean;
  availableQuantity: number;
  requestedQuantity: number;
}

export interface ReservationResult {
  reservationId: string;
  productId: string;
  quantity: number;
  expiresAt: Date;
  status: "RESERVED" | "FAILED";
}

export interface InventoryActivities {
  checkInventory(items: InventoryItem[]): Promise<InventoryCheckResult[]>;
  reserveInventory(
    items: InventoryItem[],
    orderId: string
  ): Promise<ReservationResult[]>;
  releaseReservation(reservationIds: string[]): Promise<void>;
  confirmReservation(reservationIds: string[]): Promise<void>;
  updateInventory(productId: string, quantity: number): Promise<void>;
}
