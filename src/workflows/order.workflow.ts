import {
  WorkflowController,
  WorkflowMethod,
  Signal,
  Query,
} from "nestjs-temporal-core";
import { proxyActivities, sleep } from "@temporalio/workflow";
import { EmailActivities } from "../activities/email.activities";
import { PaymentActivities } from "../activities/payment.activities";
import { InventoryActivities } from "../activities/inventory.activities";
import { Controller } from "@nestjs/common";

// Create activity proxies for use in workflows
const emailActivities = proxyActivities<EmailActivities>({
  startToCloseTimeout: "2m",
  retry: { maximumAttempts: 3 },
});

const paymentActivities = proxyActivities<PaymentActivities>({
  startToCloseTimeout: "5m",
  retry: { maximumAttempts: 5 },
});

const inventoryActivities = proxyActivities<InventoryActivities>({
  startToCloseTimeout: "1m",
  retry: { maximumAttempts: 3 },
});

interface OrderData {
  orderId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  totalAmount: number;
  customerEmail: string;
}

@Controller()
@WorkflowController({ taskQueue: "order-processing" })
export class OrderWorkflowController {
  private status = "processing";
  private currentStep = "validation";
  private paymentId?: string;
  private shippingId?: string;
  private error?: string;

  @WorkflowMethod()
  async processOrder(orderData: OrderData): Promise<string> {
    try {
      this.status = "processing";
      this.currentStep = "validation";

      // Step 1: Validate order
      await this.validateOrder(orderData);

      // Step 2: Reserve inventory
      this.currentStep = "inventory_reservation";
      const reservationId = await inventoryActivities.reserveInventory(
        orderData.orderId,
        orderData.items
      );

      // Step 3: Process payment
      this.currentStep = "payment_processing";
      this.paymentId = await paymentActivities.processPayment(
        orderData.orderId,
        orderData.customerId,
        orderData.totalAmount
      );

      // Step 4: Confirm inventory
      this.currentStep = "inventory_confirmation";
      await inventoryActivities.confirmReservation(reservationId);

      // Step 5: Send confirmation email
      this.currentStep = "email_notification";
      await emailActivities.sendOrderConfirmation(
        orderData.customerEmail,
        orderData.orderId,
        this.paymentId
      );

      // Step 6: Schedule shipping (with delay to simulate processing time)
      this.currentStep = "shipping_preparation";
      await sleep("30s"); // Simulate processing time

      this.shippingId = await this.scheduleShipping(orderData);

      // Step 7: Send shipping notification
      this.currentStep = "shipping_notification";
      await emailActivities.sendShippingNotification(
        orderData.customerEmail,
        orderData.orderId,
        this.shippingId!
      );

      this.status = "completed";
      this.currentStep = "completed";
      return this.status;
    } catch (error) {
      this.status = "failed";
      this.error = error.message;

      // Compensation logic
      await this.compensateOrder(orderData);
      throw error;
    }
  }

  @Signal("cancelOrder")
  async cancelOrder(reason: string): Promise<void> {
    if (this.status === "completed") {
      throw new Error("Cannot cancel completed order");
    }

    this.status = "cancelled";
    this.error = `Cancelled: ${reason}`;

    // Send cancellation email
    // Note: In a real implementation, you'd need to pass customer email via signal
    // or store it in workflow state
  }

  @Signal("updateShipping")
  async updateShippingAddress(newAddress: any): Promise<void> {
    // Update shipping address logic
    console.log("Updating shipping address:", newAddress);
  }

  @Query("getOrderStatus")
  getOrderStatus(): any {
    return {
      status: this.status,
      currentStep: this.currentStep,
      paymentId: this.paymentId,
      shippingId: this.shippingId,
      error: this.error,
    };
  }

  @Query("getProgress")
  getProgress(): number {
    const steps = [
      "validation",
      "inventory_reservation",
      "payment_processing",
      "inventory_confirmation",
      "email_notification",
      "shipping_preparation",
      "shipping_notification",
      "completed",
    ];

    const currentIndex = steps.indexOf(this.currentStep);
    return Math.round((currentIndex / (steps.length - 1)) * 100);
  }

  private async validateOrder(orderData: OrderData): Promise<void> {
    // Basic validation
    if (!orderData.orderId || !orderData.customerId) {
      throw new Error("Invalid order data");
    }

    if (orderData.items.length === 0) {
      throw new Error("Order must contain at least one item");
    }
  }

  private async scheduleShipping(orderData: OrderData): Promise<string> {
    // Simulate shipping service call
    return `SHIP-${orderData.orderId}-${Date.now()}`;
  }

  private async compensateOrder(orderData: OrderData): Promise<void> {
    // Compensation logic for failed orders
    if (this.paymentId) {
      try {
        await paymentActivities.refundPayment(this.paymentId);
      } catch (error) {
        console.error("Failed to refund payment:", error);
      }
    }

    // Release inventory reservations, send failure notifications, etc.
  }
}
