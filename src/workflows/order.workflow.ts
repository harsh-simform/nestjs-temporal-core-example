import {
  proxyActivities,
  defineSignal,
  defineQuery,
  setHandler,
  sleep,
} from "@temporalio/workflow";
import {
  EmailActivities,
  OrderEmailData,
} from "src/interfaces/email.interface";
import {
  InventoryActivities,
  InventoryItem,
} from "src/interfaces/inventory.interface";
import {
  OrderData,
  OrderProgress,
  OrderStatus,
} from "src/interfaces/order.interface";
import { PaymentActivities } from "src/interfaces/payment.interface";

// Define signals for external interaction
export const cancelOrderSignal = defineSignal<[string]>("cancelOrder");
export const updateOrderSignal =
  defineSignal<[Partial<OrderData>]>("updateOrder");

// Define queries for status checking
export const getOrderStatusQuery = defineQuery<OrderStatus>("getOrderStatus");
export const getOrderProgressQuery =
  defineQuery<OrderProgress>("getOrderProgress");

// Activity proxy configuration
const paymentActivities = proxyActivities<PaymentActivities>({
  startToCloseTimeout: "5m",
  retry: {
    maximumAttempts: 3,
    initialInterval: "1s",
    maximumInterval: "10s",
  },
});

const inventoryActivities = proxyActivities<InventoryActivities>({
  startToCloseTimeout: "2m",
  retry: {
    maximumAttempts: 5,
    initialInterval: "500ms",
    maximumInterval: "5s",
  },
});

const emailActivities = proxyActivities<EmailActivities>({
  startToCloseTimeout: "1m",
  retry: {
    maximumAttempts: 3,
    initialInterval: "1s",
    maximumInterval: "5s",
  },
});

export async function processOrderWorkflow(
  orderData: OrderData
): Promise<OrderStatus> {
  // Initialize order status
  let orderStatus: OrderStatus = {
    orderId: orderData.orderId,
    status: "PENDING",
    currentStep: "Order received",
    reservationIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let isCancelled = false;
  let cancellationReason = "";

  // Set up signal handlers
  setHandler(cancelOrderSignal, (reason: string) => {
    isCancelled = true;
    cancellationReason = reason;
  });

  setHandler(updateOrderSignal, (updates: Partial<OrderData>) => {
    // Handle order updates if needed
    Object.assign(orderData, updates);
  });

  // Set up query handlers
  setHandler(getOrderStatusQuery, () => orderStatus);
  setHandler(getOrderProgressQuery, (): OrderProgress => {
    const steps = [
      "Order received",
      "Inventory check",
      "Inventory reservation",
      "Payment processing",
      "Payment confirmation",
      "Order confirmation",
      "Shipping preparation",
      "Order shipped",
    ];

    const currentStepIndex = steps.indexOf(orderStatus.currentStep);
    const percentage = ((currentStepIndex + 1) / steps.length) * 100;

    return {
      orderId: orderData.orderId,
      currentStep: currentStepIndex + 1,
      totalSteps: steps.length,
      stepName: orderStatus.currentStep,
      percentage: Math.round(percentage),
      estimatedCompletion: new Date(
        Date.now() + (steps.length - currentStepIndex - 1) * 2 * 60 * 1000
      ), // 2 min per step
    };
  });

  try {
    // Step 1: Validate order and check inventory
    orderStatus.currentStep = "Inventory check";
    orderStatus.updatedAt = new Date();

    if (isCancelled) {
      throw new Error(`Order cancelled: ${cancellationReason}`);
    }

    const inventoryItems: InventoryItem[] = orderData.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const inventoryCheck = await inventoryActivities.checkInventory(
      inventoryItems
    );

    // Check if all items are available
    const unavailableItems = inventoryCheck.filter((check) => !check.available);
    if (unavailableItems.length > 0) {
      throw new Error(
        `Insufficient inventory for products: ${unavailableItems
          .map((item) => item.productId)
          .join(", ")}`
      );
    }

    // Step 2: Reserve inventory
    orderStatus.currentStep = "Inventory reservation";
    orderStatus.status = "INVENTORY_RESERVED";
    orderStatus.updatedAt = new Date();

    if (isCancelled) {
      throw new Error(`Order cancelled: ${cancellationReason}`);
    }

    const reservations = await inventoryActivities.reserveInventory(
      inventoryItems,
      orderData.orderId
    );

    // Check if all reservations were successful
    const failedReservations = reservations.filter(
      (res) => res.status === "FAILED"
    );
    if (failedReservations.length > 0) {
      throw new Error(
        `Failed to reserve inventory for products: ${failedReservations
          .map((res) => res.productId)
          .join(", ")}`
      );
    }

    orderStatus.reservationIds = reservations.map((res) => res.reservationId);

    // Step 3: Process payment
    orderStatus.currentStep = "Payment processing";
    orderStatus.status = "PAYMENT_PROCESSING";
    orderStatus.updatedAt = new Date();

    if (isCancelled) {
      // Release reservations before cancelling
      await inventoryActivities.releaseReservation(orderStatus.reservationIds);
      throw new Error(`Order cancelled: ${cancellationReason}`);
    }

    const paymentResult = await paymentActivities.processPayment({
      orderId: orderData.orderId,
      amount: orderData.totalAmount,
      currency: "USD",
      customerId: orderData.customerId,
      paymentMethod: orderData.paymentMethod,
    });

    if (paymentResult.status === "FAILED") {
      // Release reservations
      await inventoryActivities.releaseReservation(orderStatus.reservationIds);
      throw new Error(`Payment failed: ${paymentResult.failureReason}`);
    }

    orderStatus.paymentId = paymentResult.paymentId;
    orderStatus.currentStep = "Payment confirmation";
    orderStatus.status = "PAYMENT_CONFIRMED";
    orderStatus.updatedAt = new Date();

    // Step 4: Confirm inventory reservations
    await inventoryActivities.confirmReservation(orderStatus.reservationIds);

    // Step 5: Send confirmation emails
    orderStatus.currentStep = "Order confirmation";
    orderStatus.status = "CONFIRMED";
    orderStatus.updatedAt = new Date();

    const emailData: OrderEmailData = {
      orderId: orderData.orderId,
      customerEmail: orderData.customerEmail,
      customerName: orderData.customerName,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      paymentId: paymentResult.paymentId,
    };

    // Send order confirmation email
    await emailActivities.sendOrderConfirmation(emailData);

    // Send payment confirmation email
    await emailActivities.sendPaymentConfirmation(emailData);

    // Step 6: Prepare for shipping
    orderStatus.currentStep = "Shipping preparation";
    orderStatus.status = "SHIPPING";
    orderStatus.updatedAt = new Date();

    if (isCancelled) {
      // At this point, we might not be able to cancel easily
      // but we'll attempt compensation
      await compensateOrder(orderStatus, emailData, cancellationReason);
      throw new Error(
        `Order cancelled after confirmation: ${cancellationReason}`
      );
    }

    // Simulate shipping preparation time
    await sleep("30s");

    // Step 7: Generate tracking and mark as shipped
    const trackingNumber = `TRK${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase()}`;
    orderStatus.trackingNumber = trackingNumber;
    orderStatus.currentStep = "Order shipped";
    orderStatus.status = "SHIPPED";
    orderStatus.updatedAt = new Date();

    // Send shipping notification
    await emailActivities.sendShippingNotification({
      ...emailData,
      trackingNumber,
    });

    return orderStatus;
  } catch (error) {
    // Handle cancellation or failure
    orderStatus.status = isCancelled ? "CANCELLED" : "FAILED";
    orderStatus.cancellationReason = isCancelled
      ? cancellationReason
      : undefined;
    orderStatus.error = error.message;
    orderStatus.updatedAt = new Date();

    // Compensation logic
    if (orderStatus.reservationIds.length > 0) {
      try {
        await inventoryActivities.releaseReservation(
          orderStatus.reservationIds
        );
      } catch (compensationError) {
        // Log compensation error but don't throw
        console.error(
          "Failed to release inventory reservations:",
          compensationError
        );
      }
    }

    if (orderStatus.paymentId) {
      try {
        await paymentActivities.refundPayment(
          orderStatus.paymentId,
          orderData.totalAmount
        );
      } catch (compensationError) {
        // Log compensation error but don't throw
        console.error("Failed to refund payment:", compensationError);
      }
    }

    // Send cancellation email if cancelled
    if (isCancelled) {
      try {
        const emailData: OrderEmailData = {
          orderId: orderData.orderId,
          customerEmail: orderData.customerEmail,
          customerName: orderData.customerName,
          items: orderData.items,
          totalAmount: orderData.totalAmount,
        };

        await emailActivities.sendOrderCancellation({
          ...emailData,
          reason: cancellationReason,
        });
      } catch (emailError) {
        console.error("Failed to send cancellation email:", emailError);
      }
    }

    return orderStatus;
  }
}

// Compensation function for complex cancellation scenarios
async function compensateOrder(
  orderStatus: OrderStatus,
  emailData: OrderEmailData,
  reason: string
): Promise<void> {
  try {
    // Refund payment
    if (orderStatus.paymentId) {
      await paymentActivities.refundPayment(
        orderStatus.paymentId,
        emailData.totalAmount
      );
    }

    // Send cancellation email
    await emailActivities.sendOrderCancellation({
      ...emailData,
      reason,
    });
  } catch (error) {
    console.error("Compensation failed:", error);
    // In a real system, this might trigger manual intervention
  }
}
