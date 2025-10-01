import { Injectable, Logger } from "@nestjs/common";
import { Activity, ActivityMethod } from "nestjs-temporal-core";

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

@Injectable()
@Activity()
export class InventoryActivityService implements InventoryActivities {
  private readonly logger = new Logger(InventoryActivityService.name);

  // Simulate inventory database
  private inventory = new Map<string, number>([
    ["product-1", 100],
    ["product-2", 50],
    ["product-3", 25],
    ["product-4", 75],
    ["product-5", 0],
  ]);

  private reservations = new Map<
    string,
    { productId: string; quantity: number; orderId: string; expiresAt: Date }
  >();

  @ActivityMethod()
  async checkInventory(
    items: InventoryItem[]
  ): Promise<InventoryCheckResult[]> {
    this.logger.log(`Checking inventory for ${items.length} items`);

    // Simulate database query delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const results: InventoryCheckResult[] = items.map((item) => {
      const availableQuantity = this.inventory.get(item.productId) || 0;
      const available = availableQuantity >= item.quantity;

      this.logger.log(
        `Product ${item.productId}: requested ${item.quantity}, available ${availableQuantity}, sufficient: ${available}`
      );

      return {
        productId: item.productId,
        available,
        availableQuantity,
        requestedQuantity: item.quantity,
      };
    });

    return results;
  }

  @ActivityMethod()
  async reserveInventory(
    items: InventoryItem[],
    orderId: string
  ): Promise<ReservationResult[]> {
    this.logger.log(
      `Reserving inventory for order ${orderId}, ${items.length} items`
    );

    // Simulate reservation processing delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const results: ReservationResult[] = [];

    for (const item of items) {
      const availableQuantity = this.inventory.get(item.productId) || 0;

      if (availableQuantity >= item.quantity) {
        const reservationId = `res_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Update inventory (temporary reservation)
        this.inventory.set(item.productId, availableQuantity - item.quantity);

        // Store reservation
        this.reservations.set(reservationId, {
          productId: item.productId,
          quantity: item.quantity,
          orderId,
          expiresAt,
        });

        results.push({
          reservationId,
          productId: item.productId,
          quantity: item.quantity,
          expiresAt,
          status: "RESERVED",
        });

        this.logger.log(
          `Reserved ${item.quantity} units of ${item.productId} (reservation: ${reservationId})`
        );
      } else {
        results.push({
          reservationId: "",
          productId: item.productId,
          quantity: item.quantity,
          expiresAt: new Date(),
          status: "FAILED",
        });

        this.logger.error(
          `Failed to reserve ${item.quantity} units of ${item.productId} (only ${availableQuantity} available)`
        );
      }
    }

    return results;
  }

  @ActivityMethod()
  async releaseReservation(reservationIds: string[]): Promise<void> {
    this.logger.log(`Releasing ${reservationIds.length} reservations`);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    for (const reservationId of reservationIds) {
      const reservation = this.reservations.get(reservationId);

      if (reservation) {
        // Return inventory
        const currentQuantity = this.inventory.get(reservation.productId) || 0;
        this.inventory.set(
          reservation.productId,
          currentQuantity + reservation.quantity
        );

        // Remove reservation
        this.reservations.delete(reservationId);

        this.logger.log(
          `Released reservation ${reservationId} for ${reservation.quantity} units of ${reservation.productId}`
        );
      }
    }
  }

  @ActivityMethod()
  async confirmReservation(reservationIds: string[]): Promise<void> {
    this.logger.log(`Confirming ${reservationIds.length} reservations`);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    for (const reservationId of reservationIds) {
      const reservation = this.reservations.get(reservationId);

      if (reservation) {
        // Remove reservation (inventory already deducted during reservation)
        this.reservations.delete(reservationId);

        this.logger.log(
          `Confirmed reservation ${reservationId} for ${reservation.quantity} units of ${reservation.productId}`
        );
      }
    }
  }

  @ActivityMethod()
  async updateInventory(productId: string, quantity: number): Promise<void> {
    this.logger.log(
      `Updating inventory for ${productId}: ${
        quantity > 0 ? "+" : ""
      }${quantity}`
    );

    // Simulate update delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    const currentQuantity = this.inventory.get(productId) || 0;
    this.inventory.set(productId, Math.max(0, currentQuantity + quantity));

    this.logger.log(
      `Inventory updated for ${productId}: new quantity ${this.inventory.get(
        productId
      )}`
    );
  }
}
