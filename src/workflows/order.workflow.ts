import {
  proxyActivities,
  defineSignal,
  defineQuery,
  setHandler,
  condition,
  sleep,
  getExternalWorkflowHandle,
  workflowInfo,
} from "@temporalio/workflow";

import type {
  PaymentActivities,
  PaymentResult,
} from "../activities/payment.activities";
import type {
  InventoryActivities,
  InventoryItem,
  ReservationResult,
} from "../activities/inventory.activities";
import type {
  EmailActivities,
  OrderEmailData,
} from "../activities/email.activities";
import type {
  WorkflowActivities,
  StartFulfillmentWorkflowResult,
} from "../activities/workflow.activities";
import type {
  FulfillmentRequest,
  FulfillmentStatus,
} from "./fulfillment.workflow";

// Define signals for external interaction
export const cancelOrderSignal = defineSignal<[string]>("cancelOrder");
export const updateOrderSignal =
  defineSignal<[Partial<OrderData>]>("updateOrder");
export const pauseOrderFulfillmentSignal = defineSignal(
  "pauseOrderFulfillment"
);
export const resumeOrderFulfillmentSignal = defineSignal(
  "resumeOrderFulfillment"
);
export const fulfillmentCompletedSignal = defineSignal<[FulfillmentStatus]>(
  "fulfillmentCompleted"
);

// Define queries for status checking
export const getOrderStatusQuery = defineQuery<OrderStatus>("getOrderStatus");
export const getOrderProgressQuery =
  defineQuery<OrderProgress>("getOrderProgress");

// Order data interface
export interface OrderData {
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
}

// Order status interface
export interface OrderStatus {
  orderId: string;
  status:
    | "PENDING"
    | "PAYMENT_PROCESSING"
    | "PAYMENT_CONFIRMED"
    | "INVENTORY_RESERVED"
    | "CONFIRMED"
    | "FULFILLMENT_STARTED"
    | "FULFILLMENT_IN_PROGRESS"
    | "SHIPPING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "FAILED";
  currentStep: string;
  paymentId?: string;
  reservationIds: string[];
  trackingNumber?: string;
  fulfillmentWorkflowId?: string;
  fulfillmentStatus?: FulfillmentStatus;
  cancellationReason?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  result: any;
}

// Order progress interface
export interface OrderProgress {
  orderId: string;
  currentStep: number;
  totalSteps: number;
  stepName: string;
  percentage: number;
  estimatedCompletion?: Date;
  result?: any;
}

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

const workflowActivities = proxyActivities<WorkflowActivities>({
  startToCloseTimeout: "30s",
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
    result: null,
  };

  let isCancelled = false;
  let cancellationReason = "";
  let fulfillmentWorkflowId: string | null = null;
  let fulfillmentCompletedStatus: FulfillmentStatus | null = null;

  // Set up signal handlers
  setHandler(cancelOrderSignal, (reason: string) => {
    isCancelled = true;
    cancellationReason = reason;
  });

  setHandler(updateOrderSignal, (updates: Partial<OrderData>) => {
    // Handle order updates if needed
    Object.assign(orderData, updates);
  });

  setHandler(pauseOrderFulfillmentSignal, async () => {
    if (fulfillmentWorkflowId) {
      await workflowActivities.signalFulfillmentWorkflow({
        fulfillmentWorkflowId,
        signalName: "pauseFulfillment",
        args: [],
      });
    }
  });

  setHandler(resumeOrderFulfillmentSignal, async () => {
    if (fulfillmentWorkflowId) {
      await workflowActivities.signalFulfillmentWorkflow({
        fulfillmentWorkflowId,
        signalName: "resumeFulfillment",
        args: [],
      });
    }
  });

  setHandler(fulfillmentCompletedSignal, (status: FulfillmentStatus) => {
    fulfillmentCompletedStatus = status;
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

    orderStatus.currentStep = "Order confirmed, preparing fulfillment";
    orderStatus.status = "CONFIRMED";
    orderStatus.updatedAt = new Date();

    // Step 5: Start independent fulfillment workflow via activity
    orderStatus.currentStep = "Starting fulfillment";
    orderStatus.status = "FULFILLMENT_STARTED";
    orderStatus.updatedAt = new Date();

    if (isCancelled) {
      throw new Error(
        `Order cancelled after confirmation: ${cancellationReason}`
      );
    }

    // Get current workflow ID to enable fulfillment to signal back
    const currentWorkflowId = workflowInfo().workflowId;

    // Prepare fulfillment request
    const fulfillmentRequest: FulfillmentRequest = {
      orderId: orderData.orderId,
      customerId: orderData.customerId,
      customerEmail: orderData.customerEmail,
      customerName: orderData.customerName,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      shippingAddress: orderData.shippingAddress,
      paymentId: paymentResult.paymentId,
      reservationIds: orderStatus.reservationIds,
      orderWorkflowId: currentWorkflowId, // Pass parent workflow ID for signaling back
    };

    // Start fulfillment workflow as independent workflow via activity
    const fulfillmentResult: StartFulfillmentWorkflowResult =
      await workflowActivities.startFulfillmentWorkflow({
        orderId: orderData.orderId,
        fulfillmentRequest,
      });

    if (!fulfillmentResult.started) {
      throw new Error(
        `Failed to start fulfillment workflow: ${fulfillmentResult.error}`
      );
    }

    fulfillmentWorkflowId = fulfillmentResult.fulfillmentWorkflowId;
    orderStatus.fulfillmentWorkflowId = fulfillmentWorkflowId;
    orderStatus.currentStep = "Fulfillment in progress";
    orderStatus.status = "FULFILLMENT_IN_PROGRESS";
    orderStatus.updatedAt = new Date();

    // Wait for fulfillment completion signal from fulfillment workflow
    // This is truly loosely coupled - fulfillment signals back when done
    await condition(() => fulfillmentCompletedStatus !== null || isCancelled);

    if (isCancelled) {
      throw new Error(
        `Order cancelled during fulfillment: ${cancellationReason}`
      );
    }

    // Process fulfillment completion status received via signal
    if (fulfillmentCompletedStatus) {
      orderStatus.fulfillmentStatus = fulfillmentCompletedStatus;

      if (fulfillmentCompletedStatus.status === "SHIPPED") {
        orderStatus.status = "SHIPPED";
        orderStatus.currentStep = "Order shipped";
        orderStatus.trackingNumber = fulfillmentCompletedStatus.trackingNumber;
      } else if (fulfillmentCompletedStatus.status === "CANCELLED") {
        orderStatus.status = "CANCELLED";
        orderStatus.currentStep = "Fulfillment cancelled";
        orderStatus.cancellationReason =
          fulfillmentCompletedStatus.cancellationReason;
      } else if (fulfillmentCompletedStatus.status === "FAILED") {
        orderStatus.status = "FAILED";
        orderStatus.error = fulfillmentCompletedStatus.error;
      }

      orderStatus.updatedAt = new Date();
    }

    // Step 6: Send confirmation emails AFTER fulfillment completes
    if (fulfillmentCompletedStatus?.status === "SHIPPED") {
      orderStatus.currentStep = "Sending confirmation emails";
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

      // Send shipping notification with tracking number
      if (fulfillmentCompletedStatus.trackingNumber) {
        await emailActivities.sendShippingNotification({
          ...emailData,
          trackingNumber: fulfillmentCompletedStatus.trackingNumber,
        });
      }

      orderStatus.currentStep = "Order completed";
      orderStatus.updatedAt = new Date();
    }

    return orderStatus;
  } catch (error) {
    // Handle cancellation or failure
    orderStatus.status = isCancelled ? "CANCELLED" : "FAILED";
    orderStatus.cancellationReason = isCancelled
      ? cancellationReason
      : undefined;
    orderStatus.error = error.message;
    orderStatus.updatedAt = new Date();

    // Cancel independent fulfillment workflow if it exists
    if (fulfillmentWorkflowId && isCancelled) {
      try {
        await workflowActivities.signalFulfillmentWorkflow({
          fulfillmentWorkflowId,
          signalName: "cancelFulfillment",
          args: [cancellationReason],
        });
      } catch (signalError) {
        console.error("Failed to cancel fulfillment workflow:", signalError);
      }
    }

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
