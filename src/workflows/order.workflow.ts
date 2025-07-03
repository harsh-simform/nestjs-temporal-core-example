import {
  proxyActivities,
  sleep,
  defineSignal,
  defineQuery,
  setHandler,
} from "@temporalio/workflow";
import type { EmailActivities } from "../activities/email.activities";
import type { PaymentActivities } from "../activities/payment.activities";
import type { InventoryActivities } from "../activities/inventory.activities";
import type { OrderData } from "../interfaces";

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


// Define signals and queries
export const cancelOrderSignal = defineSignal<[string]>("cancelOrder");
export const updateShippingSignal = defineSignal<[any]>("updateShipping");
export const getOrderStatusQuery = defineQuery<any>("getOrderStatus");
export const getProgressQuery = defineQuery<number>("getProgress");

// Workflow state
let status = "processing";
let currentStep = "validation";
let paymentId: string | undefined;
let shippingId: string | undefined;
let error: string | undefined;

export async function processOrder(orderData: OrderData): Promise<string> {
  // Set up signal and query handlers
  setHandler(cancelOrderSignal, async (reason: string) => {
    if (status === "completed") {
      throw new Error("Cannot cancel completed order");
    }

    status = "cancelled";
    error = `Cancelled: ${reason}`;
  });

  setHandler(updateShippingSignal, async (newAddress: any) => {
    console.log("Updating shipping address:", newAddress);
    // Update shipping address logic
  });

  setHandler(getOrderStatusQuery, () => ({
    status,
    currentStep,
    paymentId,
    shippingId,
    error,
  }));

  setHandler(getProgressQuery, () => {
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

    const currentIndex = steps.indexOf(currentStep);
    return Math.round((currentIndex / (steps.length - 1)) * 100);
  });

  try {
    status = "processing";
    currentStep = "validation";

    // Step 1: Validate order
    await validateOrder(orderData);

    // Step 2: Reserve inventory
    currentStep = "inventory_reservation";
    const reservationId = await inventoryActivities.reserveInventory(
      orderData.orderId,
      orderData.items
    );

    // Step 3: Process payment
    currentStep = "payment_processing";
    paymentId = await paymentActivities.processPayment(
      orderData.orderId,
      orderData.customerId,
      orderData.totalAmount
    );

    // Step 4: Confirm inventory
    currentStep = "inventory_confirmation";
    await inventoryActivities.confirmReservation(reservationId);

    // Step 5: Send confirmation email
    currentStep = "email_notification";
    await emailActivities.sendOrderConfirmation(
      orderData.customerEmail,
      orderData.orderId,
      paymentId
    );

    // Step 6: Schedule shipping (with delay to simulate processing time)
    currentStep = "shipping_preparation";
    await sleep("30s"); // Simulate processing time

    shippingId = await scheduleShipping(orderData);

    // Step 7: Send shipping notification
    currentStep = "shipping_notification";
    await emailActivities.sendShippingNotification(
      orderData.customerEmail,
      orderData.orderId,
      shippingId!
    );

    status = "completed";
    currentStep = "completed";
    return status;
  } catch (workflowError) {
    status = "failed";
    error = workflowError.message;

    // Compensation logic
    await compensateOrder(orderData);
    throw workflowError;
  }
}

async function validateOrder(orderData: OrderData): Promise<void> {
  // Basic validation
  if (!orderData.orderId || !orderData.customerId) {
    throw new Error("Invalid order data");
  }

  if (orderData.items.length === 0) {
    throw new Error("Order must contain at least one item");
  }
}

async function scheduleShipping(orderData: OrderData): Promise<string> {
  // Simulate shipping service call
  return `SHIP-${orderData.orderId}-${Date.now()}`;
}

async function compensateOrder(orderData: OrderData): Promise<void> {
  // Compensation logic for failed orders
  if (paymentId) {
    try {
      await paymentActivities.refundPayment(paymentId);
    } catch (refundError) {
      console.error("Failed to refund payment:", refundError);
    }
  }

  // Release inventory reservations, send failure notifications, etc.
}
