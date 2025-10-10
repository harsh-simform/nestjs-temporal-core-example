import {
  proxyActivities,
  defineSignal,
  defineQuery,
  setHandler,
  condition,
  sleep,
} from "@temporalio/workflow";

import type {
  InventoryActivities,
  InventoryItem,
} from "../activities/inventory.activities";
import type {
  EmailActivities,
  OrderEmailData,
} from "../activities/email.activities";

// Define signals for fulfillment workflow
export const startFulfillmentSignal =
  defineSignal<[FulfillmentRequest]>("startFulfillment");
export const pauseFulfillmentSignal = defineSignal("pauseFulfillment");
export const resumeFulfillmentSignal = defineSignal("resumeFulfillment");
export const cancelFulfillmentSignal =
  defineSignal<[string]>("cancelFulfillment");
export const updateShippingAddressSignal = defineSignal<[ShippingAddress]>(
  "updateShippingAddress"
);

// Define queries for fulfillment status
export const getFulfillmentStatusQuery = defineQuery<FulfillmentStatus>(
  "getFulfillmentStatus"
);
export const getFulfillmentProgressQuery = defineQuery<FulfillmentProgress>(
  "getFulfillmentProgress"
);

// Fulfillment interfaces
export interface FulfillmentRequest {
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
  shippingAddress: ShippingAddress;
  paymentId: string;
  reservationIds: string[];
  orderWorkflowId?: string; // Parent workflow ID to signal back completion
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface FulfillmentStatus {
  orderId: string;
  status:
    | "WAITING"
    | "PICKING"
    | "PACKING"
    | "READY_TO_SHIP"
    | "SHIPPED"
    | "PAUSED"
    | "CANCELLED"
    | "FAILED";
  currentStep: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  estimatedDelivery?: Date;
  isPaused: boolean;
  cancellationReason?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FulfillmentProgress {
  orderId: string;
  currentStep: number;
  totalSteps: number;
  stepName: string;
  percentage: number;
  itemsPicked: number;
  totalItems: number;
  estimatedCompletion?: Date;
}

import type { WorkflowActivities } from "../activities/workflow.activities";

// Activity proxy configuration
const inventoryActivities = proxyActivities<InventoryActivities>({
  startToCloseTimeout: "2m",
  retry: {
    maximumAttempts: 3,
    initialInterval: "1s",
    maximumInterval: "10s",
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

export async function fulfillmentWorkflow(
  orderId: string
): Promise<FulfillmentStatus> {
  // Initialize fulfillment status
  let fulfillmentStatus: FulfillmentStatus = {
    orderId,
    status: "WAITING",
    currentStep: "Waiting for fulfillment request",
    isPaused: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let fulfillmentRequest: FulfillmentRequest | null = null;
  let isCancelled = false;
  let cancellationReason = "";
  let isPaused = false;
  let itemsPicked = 0;

  // Set up signal handlers
  setHandler(startFulfillmentSignal, (request: FulfillmentRequest) => {
    fulfillmentRequest = request;
    fulfillmentStatus.status = "PICKING";
    fulfillmentStatus.currentStep = "Starting order picking";
    fulfillmentStatus.updatedAt = new Date();
  });

  setHandler(pauseFulfillmentSignal, () => {
    isPaused = true;
    fulfillmentStatus.isPaused = true;
    fulfillmentStatus.status = "PAUSED";
    fulfillmentStatus.currentStep = "Fulfillment paused";
    fulfillmentStatus.updatedAt = new Date();
  });

  setHandler(resumeFulfillmentSignal, () => {
    isPaused = false;
    fulfillmentStatus.isPaused = false;
    fulfillmentStatus.status = "PICKING";
    fulfillmentStatus.currentStep = "Fulfillment resumed";
    fulfillmentStatus.updatedAt = new Date();
  });

  setHandler(cancelFulfillmentSignal, (reason: string) => {
    isCancelled = true;
    cancellationReason = reason;
    fulfillmentStatus.status = "CANCELLED";
    fulfillmentStatus.cancellationReason = reason;
    fulfillmentStatus.updatedAt = new Date();
  });

  setHandler(updateShippingAddressSignal, (newAddress: ShippingAddress) => {
    if (fulfillmentRequest) {
      fulfillmentRequest.shippingAddress = newAddress;
      fulfillmentStatus.currentStep = "Shipping address updated";
      fulfillmentStatus.updatedAt = new Date();
    }
  });

  // Set up query handlers
  setHandler(getFulfillmentStatusQuery, () => fulfillmentStatus);
  setHandler(getFulfillmentProgressQuery, (): FulfillmentProgress => {
    const steps = [
      "Waiting for fulfillment request",
      "Starting order picking",
      "Picking items",
      "Quality check",
      "Packing items",
      "Generating shipping label",
      "Ready for pickup",
      "Shipped",
    ];

    const currentStepIndex = steps.indexOf(fulfillmentStatus.currentStep);
    const percentage = fulfillmentRequest
      ? Math.max(
          ((currentStepIndex + 1) / steps.length) * 100,
          (itemsPicked / fulfillmentRequest.items.length) * 50
        )
      : 0;

    return {
      orderId,
      currentStep: Math.max(currentStepIndex + 1, 1),
      totalSteps: steps.length,
      stepName: fulfillmentStatus.currentStep,
      percentage: Math.round(percentage),
      itemsPicked,
      totalItems: fulfillmentRequest?.items.length || 0,
      estimatedCompletion: fulfillmentRequest
        ? new Date(
            Date.now() + (steps.length - currentStepIndex - 1) * 3 * 60 * 1000
          )
        : undefined,
    };
  });

  try {
    // Wait for fulfillment signal
    await condition(() => fulfillmentRequest !== null || isCancelled);

    if (isCancelled) {
      throw new Error(`Fulfillment cancelled: ${cancellationReason}`);
    }

    if (!fulfillmentRequest) {
      throw new Error("Fulfillment request not received");
    }

    // Step 1: Start picking process
    fulfillmentStatus.currentStep = "Picking items";
    fulfillmentStatus.status = "PICKING";
    fulfillmentStatus.updatedAt = new Date();

    // Simulate item picking with pausing support
    for (let i = 0; i < fulfillmentRequest.items.length; i++) {
      // Check for pause
      if (isPaused) {
        await condition(() => !isPaused || isCancelled);
        if (isCancelled) {
          throw new Error(
            `Fulfillment cancelled during picking: ${cancellationReason}`
          );
        }
      }

      if (isCancelled) {
        throw new Error(`Fulfillment cancelled: ${cancellationReason}`);
      }

      const item = fulfillmentRequest.items[i];

      // Simulate picking time per item
      await sleep(`${2000 + Math.random() * 3000}ms`);

      itemsPicked++;
      fulfillmentStatus.currentStep = `Picked ${itemsPicked}/${fulfillmentRequest.items.length} items`;
      fulfillmentStatus.updatedAt = new Date();
    }

    // Step 2: Quality check
    fulfillmentStatus.currentStep = "Quality check";
    fulfillmentStatus.updatedAt = new Date();

    // Check for pause/cancellation
    if (isPaused) {
      await condition(() => !isPaused || isCancelled);
      if (isCancelled) {
        throw new Error(
          `Fulfillment cancelled during quality check: ${cancellationReason}`
        );
      }
    }

    if (isCancelled) {
      throw new Error(`Fulfillment cancelled: ${cancellationReason}`);
    }

    await sleep("5s"); // Quality check time

    // Step 3: Packing
    fulfillmentStatus.currentStep = "Packing items";
    fulfillmentStatus.status = "PACKING";
    fulfillmentStatus.updatedAt = new Date();

    // Check for pause/cancellation
    if (isPaused) {
      await condition(() => !isPaused || isCancelled);
      if (isCancelled) {
        throw new Error(
          `Fulfillment cancelled during packing: ${cancellationReason}`
        );
      }
    }

    if (isCancelled) {
      throw new Error(`Fulfillment cancelled: ${cancellationReason}`);
    }

    await sleep("10s"); // Packing time

    // Step 4: Generate shipping label
    fulfillmentStatus.currentStep = "Generating shipping label";
    fulfillmentStatus.updatedAt = new Date();

    if (isCancelled) {
      throw new Error(`Fulfillment cancelled: ${cancellationReason}`);
    }

    const trackingNumber = `FUL${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase()}`;

    const shippingCarrier = "FastShip Express";
    const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

    fulfillmentStatus.trackingNumber = trackingNumber;
    fulfillmentStatus.shippingCarrier = shippingCarrier;
    fulfillmentStatus.estimatedDelivery = estimatedDelivery;

    // Step 5: Ready for pickup
    fulfillmentStatus.currentStep = "Ready for pickup";
    fulfillmentStatus.status = "READY_TO_SHIP";
    fulfillmentStatus.updatedAt = new Date();

    if (isCancelled) {
      throw new Error(`Fulfillment cancelled: ${cancellationReason}`);
    }

    // Wait for carrier pickup (simulate)
    await sleep("30s");

    // Step 6: Shipped
    fulfillmentStatus.currentStep = "Shipped";
    fulfillmentStatus.status = "SHIPPED";
    fulfillmentStatus.updatedAt = new Date();

    // Signal back to order workflow that fulfillment is complete
    if (fulfillmentRequest.orderWorkflowId) {
      try {
        await workflowActivities.signalFulfillmentWorkflow({
          fulfillmentWorkflowId: fulfillmentRequest.orderWorkflowId,
          signalName: "fulfillmentCompleted",
          args: [fulfillmentStatus],
        });
      } catch (signalError) {
        console.error(
          "Failed to signal order workflow completion:",
          signalError
        );
      }
    }

    return fulfillmentStatus;
  } catch (error) {
    // Handle cancellation or failure
    fulfillmentStatus.status = isCancelled ? "CANCELLED" : "FAILED";
    fulfillmentStatus.cancellationReason = isCancelled
      ? cancellationReason
      : undefined;
    fulfillmentStatus.error = error.message;
    fulfillmentStatus.updatedAt = new Date();

    // Compensation logic
    if (fulfillmentRequest && fulfillmentRequest.reservationIds.length > 0) {
      try {
        // If we're cancelling, release any confirmed reservations back to inventory
        await inventoryActivities.releaseReservation(
          fulfillmentRequest.reservationIds
        );
      } catch (compensationError) {
        console.error(
          "Failed to release inventory during fulfillment compensation:",
          compensationError
        );
      }
    }

    // Send cancellation notification if cancelled after picking started
    if (isCancelled && fulfillmentRequest && itemsPicked > 0) {
      try {
        const emailData: OrderEmailData = {
          orderId: fulfillmentRequest.orderId,
          customerEmail: fulfillmentRequest.customerEmail,
          customerName: fulfillmentRequest.customerName,
          items: fulfillmentRequest.items,
          totalAmount: fulfillmentRequest.totalAmount,
          paymentId: fulfillmentRequest.paymentId,
        };

        await emailActivities.sendOrderCancellation({
          ...emailData,
          reason: `Fulfillment cancelled: ${cancellationReason}`,
        });
      } catch (emailError) {
        console.error(
          "Failed to send fulfillment cancellation email:",
          emailError
        );
      }
    }

    // Signal back to order workflow that fulfillment completed (failed/cancelled)
    if (fulfillmentRequest?.orderWorkflowId) {
      try {
        await workflowActivities.signalFulfillmentWorkflow({
          fulfillmentWorkflowId: fulfillmentRequest.orderWorkflowId,
          signalName: "fulfillmentCompleted",
          args: [fulfillmentStatus],
        });
      } catch (signalError) {
        console.error(
          "Failed to signal order workflow completion (failure):",
          signalError
        );
      }
    }

    return fulfillmentStatus;
  }
}
