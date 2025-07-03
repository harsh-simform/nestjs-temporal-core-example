import { Injectable } from "@nestjs/common";
import { Activity, ActivityMethod } from "nestjs-temporal-core";
import type { InventoryItem } from "../interfaces";


@Injectable()
@Activity()
export class InventoryActivities {
  private reservations = new Map<string, InventoryItem[]>();

  @ActivityMethod()
  async reserveInventory(
    orderId: string,
    items: InventoryItem[]
  ): Promise<string> {
    console.log(`📦 Reserving inventory for order ${orderId}`);

    await this.delay(1000);

    // Simulate inventory checks
    for (const item of items) {
      if (Math.random() < 0.05) {
        throw new Error(`Product ${item.productId} is out of stock`);
      }
    }

    const reservationId = `RES-${orderId}-${Date.now()}`;
    this.reservations.set(reservationId, items);

    console.log(`✅ Inventory reserved successfully: ${reservationId}`);
    return reservationId;
  }

  @ActivityMethod()
  async confirmReservation(reservationId: string): Promise<void> {
    console.log(`✅ Confirming inventory reservation ${reservationId}`);

    await this.delay(500);

    if (!this.reservations.has(reservationId)) {
      throw new Error(`Reservation ${reservationId} not found`);
    }

    // In a real system, this would update the actual inventory
    console.log(`✅ Inventory reservation confirmed`);
  }

  @ActivityMethod()
  async releaseReservation(reservationId: string): Promise<void> {
    console.log(`🔄 Releasing inventory reservation ${reservationId}`);

    await this.delay(300);

    this.reservations.delete(reservationId);

    console.log(`✅ Inventory reservation released`);
  }

  @ActivityMethod()
  async checkInventory(productId: string): Promise<number> {
    console.log(`🔍 Checking inventory for product ${productId}`);

    await this.delay(200);

    // Simulate inventory levels
    const quantity = Math.floor(Math.random() * 100) + 10;

    console.log(`📦 Product ${productId} has ${quantity} units available`);
    return quantity;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
