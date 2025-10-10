# Loosely Coupled Workflow Implementation Summary

## What Was Implemented

A **loosely coupled workflow pattern** where the order workflow and fulfillment workflow are completely independent, communicating only through signals and queries mediated by activities.

## Key Components

### 1. **WorkflowActivityService** (`src/activities/workflow.activities.ts`)

```typescript
@Activity()
export class WorkflowActivityService {
  // Start independent fulfillment workflow
  startFulfillmentWorkflow(request): Promise<StartFulfillmentWorkflowResult>;

  // Send signals to fulfillment workflow
  signalFulfillmentWorkflow(request): Promise<void>;

  // Query fulfillment workflow status
  queryFulfillmentStatus(workflowId): Promise<FulfillmentStatus>;
}
```

**Purpose**: Acts as a bridge between workflows, enabling signal-based communication without direct workflow handles.

### 2. **Order Workflow** (`src/workflows/order.workflow.ts`)

- Uses **activity** to start fulfillment workflow (not `startChild`)
- Sends signals through **activity methods** (not direct workflow handle)
- Polls for fulfillment status using **activity queries**
- No direct dependency on fulfillment workflow

### 3. **Fulfillment Workflow** (`src/workflows/fulfillment.workflow.ts`)

- Completely independent workflow
- Receives signals: `startFulfillment`, `pauseFulfillment`, `resumeFulfillment`, `cancelFulfillment`
- Exposes queries: `getFulfillmentStatus`, `getFulfillmentProgress`
- Doesn't know it was started by another workflow

## Architecture Pattern

```
Order Workflow                 Activity Layer               Fulfillment Workflow
     │                              │                              │
     ├─── startFulfillmentWorkflow ──→ temporal.startWorkflow() ───→ (started)
     │                              │                              │
     ├─── signalFulfillmentWorkflow ──→ temporal.signalWorkflow() ──→ (receives signal)
     │                              │                              │
     └─── queryFulfillmentStatus ────→ temporal.queryWorkflow() ───→ (returns status)
```

## Communication Flow

### Starting Fulfillment

1. Order workflow calls activity: `workflowActivities.startFulfillmentWorkflow()`
2. Activity starts independent workflow via `TemporalService.startWorkflow()`
3. Activity sends initial signal via `TemporalService.signalWorkflow()`
4. Returns workflow ID to order workflow (no handle)

### Controlling Fulfillment

1. Order workflow calls activity: `workflowActivities.signalFulfillmentWorkflow()`
2. Activity sends signal via `TemporalService.signalWorkflow()`
3. Fulfillment workflow receives signal and updates state

### Monitoring Fulfillment

1. Order workflow polls via activity: `workflowActivities.queryFulfillmentStatus()`
2. Activity queries workflow via `TemporalService.queryWorkflow()`
3. Returns status without direct workflow coupling

## Benefits of This Approach

### 1. **True Independence**

- No parent-child lifecycle management
- Workflows can be deployed separately
- Different task queues and scaling strategies

### 2. **Fault Isolation**

- Fulfillment failure doesn't crash order workflow
- Order workflow can continue even if fulfillment has issues
- Independent retry and timeout policies

### 3. **Operational Flexibility**

- Can pause/resume/cancel fulfillment independently
- Update shipping address during fulfillment
- Monitor each workflow separately

### 4. **Scalability**

- Scale order and fulfillment workers independently
- Different resource limits per workflow type
- Deploy to different regions/clusters

## Comparison with Tight Coupling

| Aspect              | Tight Coupling (`startChild`) | Loose Coupling (Activity + Signals) |
| ------------------- | ----------------------------- | ----------------------------------- |
| **Communication**   | Direct workflow handle        | Through activities                  |
| **Lifecycle**       | Parent manages child          | Independent                         |
| **Scaling**         | Coupled                       | Independent                         |
| **Fault Tolerance** | Child failure affects parent  | Isolated failures                   |
| **Deployment**      | Must deploy together          | Can deploy separately               |
| **Complexity**      | Simpler                       | Slightly more complex               |
| **Flexibility**     | Limited                       | High                                |

## Code Examples

### Starting a Loosely Coupled Workflow

```typescript
// Order workflow
const fulfillmentResult = await workflowActivities.startFulfillmentWorkflow({
  orderId: orderData.orderId,
  fulfillmentRequest: {
    orderId, customerEmail, items, shippingAddress, ...
  }
});

fulfillmentWorkflowId = fulfillmentResult.fulfillmentWorkflowId;
// No direct handle - just an ID
```

### Sending Signals

```typescript
// Order workflow
await workflowActivities.signalFulfillmentWorkflow({
  fulfillmentWorkflowId,
  signalName: "pauseFulfillment",
  args: [],
});
```

### Polling for Status

```typescript
// Order workflow
while (!fulfillmentComplete) {
  await sleep("5s");

  const status = await workflowActivities.queryFulfillmentStatus(
    fulfillmentWorkflowId
  );

  if (status.status === "SHIPPED") {
    fulfillmentComplete = true;
  }
}
```

## Testing

```bash
# Start services
npm run temporal:up
npm run start:dev

# Create order
curl -X POST http://localhost:3232/orders/demo

# Pause fulfillment
curl -X POST http://localhost:3232/orders/{workflowId}/fulfillment/pause

# Resume fulfillment
curl -X POST http://localhost:3232/orders/{workflowId}/fulfillment/resume

# Check status
curl http://localhost:3232/orders/{workflowId}/status
```

## When to Use This Pattern

**Use Loosely Coupled Pattern:**

- ✅ Need independent scaling
- ✅ Different teams own workflows
- ✅ Want fault isolation
- ✅ Need flexible deployment
- ✅ Workflows have different SLAs

**Use Tight Coupling:**

- ✅ Simple parent-child relationship
- ✅ Always deployed together
- ✅ Need immediate failure propagation
- ✅ Simpler debugging needs

## Key Takeaways

1. **Activities as bridges**: Use activities to decouple workflow communication
2. **Signal-only communication**: No direct workflow handles needed
3. **Polling pattern**: Query for status instead of waiting on workflow result
4. **True independence**: Workflows don't know about each other
5. **nestjs-temporal-core benefit**: Seamless NestJS DI in activities makes this pattern clean and maintainable
