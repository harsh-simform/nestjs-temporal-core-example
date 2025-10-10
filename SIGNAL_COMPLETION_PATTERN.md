# Signal-Based Workflow Completion Pattern

## Overview

This implementation demonstrates a **bidirectional signal communication pattern** between loosely coupled workflows, where the fulfillment workflow signals back to the order workflow upon completion.

## Architecture

```
┌──────────────────────┐                    ┌──────────────────────┐
│   Order Workflow     │                    │ Fulfillment Workflow │
│                      │                    │                      │
│ 1. Start via Activity├────────────────────>│ Receives Request    │
│                      │                    │                      │
│ 2. Wait for Signal   │                    │ ... Processing ...   │
│    (condition())     │                    │                      │
│         ↓            │                    │ ... Picking ...      │
│         ↓            │                    │                      │
│         ↓            │                    │ ... Packing ...      │
│         ↓            │◄────────────────────┤ 3. Signals Back     │
│                      │  fulfillmentCompleted│    When Done       │
│ 4. Send Confirmation │                    │                      │
│    Emails            │                    │                      │
└──────────────────────┘                    └──────────────────────┘
```

## Key Components

### 1. Order Workflow Signal Handler

```typescript
// Define signal to receive completion notification
export const fulfillmentCompletedSignal = defineSignal<[FulfillmentStatus]>(
  "fulfillmentCompleted"
);

// Track completion status
let fulfillmentCompletedStatus: FulfillmentStatus | null = null;

// Set up handler to receive completion signal
setHandler(fulfillmentCompletedSignal, (status: FulfillmentStatus) => {
  fulfillmentCompletedStatus = status;
});

// Wait for signal using condition()
await condition(() => fulfillmentCompletedStatus !== null || isCancelled);

// Process completion and send emails
if (fulfillmentCompletedStatus?.status === "SHIPPED") {
  // Send confirmation emails AFTER fulfillment completes
  await emailActivities.sendOrderConfirmation(emailData);
  await emailActivities.sendPaymentConfirmation(emailData);
  await emailActivities.sendShippingNotification(emailData);
}
```

### 2. Fulfillment Workflow Signaling Back

```typescript
// Receive parent workflow ID in request
export interface FulfillmentRequest {
  orderId: string;
  // ... other fields
  orderWorkflowId?: string; // Parent workflow to signal back to
}

// After completing fulfillment
fulfillmentStatus.status = "SHIPPED";

// Signal back to parent workflow
if (fulfillmentRequest.orderWorkflowId) {
  await workflowActivities.signalFulfillmentWorkflow({
    fulfillmentWorkflowId: fulfillmentRequest.orderWorkflowId,
    signalName: "fulfillmentCompleted",
    args: [fulfillmentStatus],
  });
}
```

### 3. Passing Parent Workflow ID

```typescript
// In order workflow - get own workflow ID
const currentWorkflowId = workflowInfo().workflowId;

// Include in fulfillment request
const fulfillmentRequest: FulfillmentRequest = {
  orderId: orderData.orderId,
  // ... other fields
  orderWorkflowId: currentWorkflowId, // For signaling back
};
```

## Execution Flow

### Order Workflow Side

1. **Confirm payment** → `PAYMENT_CONFIRMED`
2. **Confirm inventory** → `CONFIRMED`
3. **Start fulfillment** (via activity) → `FULFILLMENT_STARTED`
4. **Wait for signal** using `condition()` → `FULFILLMENT_IN_PROGRESS`
5. **Receive completion signal** → Process result
6. **Send confirmation emails** → `SHIPPED` (only if successful)

### Fulfillment Workflow Side

1. **Wait for start signal** → `WAITING`
2. **Pick items** → `PICKING`
3. **Pack items** → `PACKING`
4. **Generate shipping label** → `READY_TO_SHIP`
5. **Ship order** → `SHIPPED`
6. **Signal back to parent** with completion status
7. **Return** (parent already notified)

## Benefits of This Pattern

### 1. **Truly Asynchronous**

- Order workflow doesn't poll or actively wait
- Uses Temporal's `condition()` for efficient waiting
- Parent workflow is blocked but doesn't consume resources

### 2. **Immediate Notification**

- Fulfillment signals completion instantly
- No polling delays (5s, 10s, etc.)
- Parent workflow resumes immediately upon signal

### 3. **Bi-Directional Communication**

```
Order → Fulfillment: Start, Pause, Resume, Cancel
Fulfillment → Order: Completed (with status)
```

### 4. **Proper Email Timing**

- Confirmation emails sent AFTER fulfillment completes
- Customer gets accurate shipping information
- No premature "order confirmed" before actual shipment

### 5. **Fault Tolerance**

- Fulfillment signals back even on failure/cancellation
- Order workflow handles all completion states
- No orphaned waiting workflows

## Code Comparison

### Without Signal-Back (Polling)

```typescript
// Order workflow polls fulfillment status
while (!fulfillmentComplete) {
  await sleep("5s"); // Delay!

  const status = await workflowActivities.queryFulfillmentStatus(workflowId);
  if (status.status === "SHIPPED") {
    fulfillmentComplete = true;
  }
}
// 5-10 second delay before emails sent
```

**Issues:**

- Polling delay (5s minimum)
- Unnecessary activity calls
- Emails delayed by polling interval

### With Signal-Back (This Implementation)

```typescript
// Order workflow waits for signal
await condition(() => fulfillmentCompletedStatus !== null);

// Immediately process completion
if (fulfillmentCompletedStatus.status === "SHIPPED") {
  await emailActivities.sendOrderConfirmation(emailData);
}
```

**Benefits:**

- Instant notification
- No polling overhead
- Emails sent immediately upon completion

## When to Use This Pattern

**Use Signal-Back Pattern When:**

- ✅ Parent needs to wait for child completion
- ✅ Want immediate notification of completion
- ✅ Need to perform actions after child completes (e.g., send emails)
- ✅ Want to avoid polling overhead
- ✅ Child can determine when it's truly "done"

**Use Polling Pattern When:**

- ✅ Child workflow might not signal back reliably
- ✅ Parent needs to monitor progress continuously
- ✅ Multiple workflows might complete (not just one)
- ✅ Child doesn't know parent's identity

## Testing

```bash
# Start services
npm run temporal:up
npm run start:dev

# Create order
curl -X POST http://localhost:3232/orders/demo

# Monitor order status
curl http://localhost:3232/orders/{workflowId}/status

# Check fulfillment status
curl http://localhost:3232/orders/fulfillment/{fulfillmentWorkflowId}/status
```

**Expected Flow:**

1. Order created → `CONFIRMED`
2. Fulfillment started → `FULFILLMENT_IN_PROGRESS`
3. Fulfillment completes → Signals back
4. Order receives signal → Sends emails
5. Order status → `SHIPPED`

## Key Takeaways

1. **Bi-directional signals** enable rich inter-workflow communication
2. **`condition()`** provides efficient waiting without polling
3. **Pass parent workflow ID** to enable child-to-parent signaling
4. **Signal on all outcomes** (success, failure, cancellation)
5. **Process after signal** allows precise timing of follow-up actions

This pattern combines the benefits of loose coupling with the immediacy of direct communication, making it ideal for workflows that need to coordinate completion while remaining independent.
