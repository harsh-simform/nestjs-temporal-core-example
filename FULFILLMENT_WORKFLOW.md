# Fulfillment Workflow - Loosely Coupled Signal-Based Communication

This implementation demonstrates a **loosely coupled workflow pattern** using **Temporal signals** for communication between independent workflows. The order workflow and fulfillment workflow are completely decoupled and communicate only through signals and queries.

## 🏗️ Architecture Overview

```
┌─────────────────────┐                    ┌──────────────────────┐
│   Order Workflow    │                    │ Fulfillment Workflow │
│   (Independent)     │                    │   (Independent)      │
│                     │                    │                      │
│ - Payment           │                    │ - Item Picking       │
│ - Inventory         │   ┌──────────┐     │ - Quality Check      │
│ - Confirmation      │   │ Activity │     │ - Packing            │
│                     │──▶│  Starts  │──┐  │ - Shipping Label     │
└─────────────────────┘   │ Workflow │  │  └──────────────────────┘
         │                └──────────┘  │            ▲
         │                              │            │
         │   ┌────────────────────┐    └───────────▶│
         └──▶│ Signal/Query via   │                 │
             │ Activity Layer     │─────────────────┘
             └────────────────────┘
                     │
                     ▼
          REST API Control Layer
```

## 🔑 Key Design Pattern: Loosely Coupled Workflows

### **Why Loosely Coupled?**

1. **Independent Scaling**: Each workflow can scale independently
2. **Fault Isolation**: Failures in one workflow don't crash the other
3. **Flexible Deployment**: Workflows can be deployed to different task queues
4. **No Parent-Child Dependency**: No tight coupling or lifecycle management overhead
5. **Signal-Only Communication**: Workflows interact only through signals and queries

### **How It Works**

Instead of using `startChild()` (tight coupling), we use:

1. **Activity to start workflow** - `WorkflowActivityService.startFulfillmentWorkflow()`
2. **Signals for communication** - Send commands via activities
3. **Queries for status** - Poll status via activities
4. **No direct workflow handle** - Workflows are truly independent

## 🔄 Communication Architecture

### **WorkflowActivityService** - The Communication Bridge

This NestJS activity service acts as the bridge between workflows:

```typescript
@Activity()
export class WorkflowActivityService {
  // Start independent fulfillment workflow
  @ActivityMethod()
  async startFulfillmentWorkflow(request: StartFulfillmentWorkflowRequest)

  // Send signals to fulfillment workflow
  @ActivityMethod()
  async signalFulfillmentWorkflow(request: SignalFulfillmentRequest)

  // Query fulfillment workflow status
  @ActivityMethod()
  async queryFulfillmentStatus(fulfillmentWorkflowId: string)
}
```

### **Signals Available**

**Order → Fulfillment (via Activity):**

- `startFulfillment` - Initiates fulfillment with order details
- `pauseFulfillment` - Pauses fulfillment process
- `resumeFulfillment` - Resumes paused fulfillment
- `cancelFulfillment` - Cancels fulfillment with reason
- `updateShippingAddress` - Updates shipping address during fulfillment

### **Queries Available**

**Fulfillment Status (via Activity):**

- `getFulfillmentStatus` - Real-time fulfillment status
- `getFulfillmentProgress` - Step-by-step progress with item counts

## 🔄 Signal-Based Communication

### Signals Available

**From Parent → Child (Fulfillment Control):**

- `startFulfillmentSignal` - Initiates fulfillment with order details
- `pauseFulfillmentSignal` - Pauses fulfillment process
- `resumeFulfillmentSignal` - Resumes paused fulfillment
- `cancelFulfillmentSignal` - Cancels fulfillment with reason
- `updateShippingAddressSignal` - Updates shipping address during fulfillment

### Queries Available

**Child Workflow Queries:**

- `getFulfillmentStatusQuery` - Real-time fulfillment status
- `getFulfillmentProgressQuery` - Step-by-step progress with percentages

## 🚀 How to Test the Child Workflow

### 1. Start the Application

```bash
# Start Temporal server
npm run temporal:up

# Start NestJS application
npm run start:dev
```

### 2. Create an Order

```bash
# Create a demo order
curl -X POST http://localhost:3232/orders/demo
```

Response:

```json
{
  "orderId": "ORD-1703123456789-ABC123DEF",
  "workflowId": "order-workflow-ORD-1703123456789-ABC123DEF",
  "message": "Order created successfully"
}
```

### 3. Monitor Order Progress

```bash
# Check order status (includes fulfillment info)
curl http://localhost:3232/orders/{workflowId}/status

# Get order progress
curl http://localhost:3232/orders/{workflowId}/progress
```

### 4. Control Fulfillment via Signals

```bash
# Pause fulfillment
curl -X POST http://localhost:3232/orders/{workflowId}/fulfillment/pause

# Resume fulfillment
curl -X POST http://localhost:3232/orders/{workflowId}/fulfillment/resume

# Cancel entire order (cancels child workflow too)
curl -X DELETE http://localhost:3232/orders/{workflowId} \
  -H "Content-Type: application/json" \
  -d '{"reason": "Customer requested cancellation"}'
```

### 5. Direct Fulfillment Monitoring

```bash
# Get fulfillment-specific status
curl http://localhost:3232/orders/fulfillment/{fulfillmentWorkflowId}/status

# Get fulfillment progress with item picking details
curl http://localhost:3232/orders/fulfillment/{fulfillmentWorkflowId}/progress

# Update shipping address during fulfillment
curl -X PATCH http://localhost:3232/orders/fulfillment/{fulfillmentWorkflowId}/shipping-address \
  -H "Content-Type: application/json" \
  -d '{
    "street": "456 New Street",
    "city": "New City",
    "state": "NC",
    "zipCode": "54321",
    "country": "USA"
  }'
```

## 📊 Workflow Execution Flow

### Order Workflow (Parent)

1. **Payment Processing** → `PAYMENT_CONFIRMED`
2. **Inventory Confirmation** → `CONFIRMED`
3. **Start Child Workflow** → `FULFILLMENT_STARTED`
4. **Send Fulfillment Signal** → `FULFILLMENT_IN_PROGRESS`
5. **Wait for Child Completion** → `SHIPPED`

### Fulfillment Workflow (Child)

1. **Wait for Signal** → `WAITING`
2. **Receive Start Signal** → `PICKING`
3. **Pick Items** (with progress updates) → `PICKING`
4. **Quality Check** → `PICKING`
5. **Pack Items** → `PACKING`
6. **Generate Label** → `READY_TO_SHIP`
7. **Ship** → `SHIPPED`

## 🔍 Key Temporal Features Demonstrated

### 1. **Activity-Based Workflow Starting (Loosely Coupled)**

```typescript
// In order workflow - start fulfillment via activity
const fulfillmentResult = await workflowActivities.startFulfillmentWorkflow({
  orderId: orderData.orderId,
  fulfillmentRequest,
});

fulfillmentWorkflowId = fulfillmentResult.fulfillmentWorkflowId;
```

**Key Point**: No direct workflow handle, just an ID. Workflows are independent.

### 2. **Signal Communication via Activities**

```typescript
// In order workflow - send signals via activity (not direct handle)
await workflowActivities.signalFulfillmentWorkflow({
  fulfillmentWorkflowId,
  signalName: "pauseFulfillment",
  args: [],
});
```

### 3. **Status Polling via Activities**

```typescript
// In order workflow - poll for status instead of waiting on handle
while (!fulfillmentComplete && !isCancelled) {
  await sleep("5s");

  fulfillmentStatus = await workflowActivities.queryFulfillmentStatus(
    fulfillmentWorkflowId
  );

  if (fulfillmentStatus.status === "SHIPPED") {
    fulfillmentComplete = true;
  }
}
```

**Key Point**: Polling pattern instead of direct workflow result waiting.

### 4. **Signal Handlers in Fulfillment Workflow**

```typescript
setHandler(pauseFulfillmentSignal, () => {
  isPaused = true;
  fulfillmentStatus.status = "PAUSED";
});

setHandler(resumeFulfillmentSignal, () => {
  isPaused = false;
  fulfillmentStatus.status = "PICKING";
});
```

### 5. **Conditional Workflow Execution**

```typescript
// Wait for signals or cancellation
await condition(() => fulfillmentRequest !== null || isCancelled);

// Pause support during execution
if (isPaused) {
  await condition(() => !isPaused || isCancelled);
}
```

## 🎯 Real-World Benefits of Loosely Coupled Pattern

### **True Independence**

- **No Parent-Child Relationship**: Workflows don't know about each other
- **No Lifecycle Coupling**: Order workflow doesn't manage fulfillment lifecycle
- **Independent Deployment**: Can deploy workflows separately
- **Different Task Queues**: Can run on different worker pools

### **Scalability**

- **Independent Scaling**: Scale order and fulfillment workers separately
- **Resource Isolation**: Different resource limits and priorities
- **Flexible Infrastructure**: Deploy to different regions/clusters

### **Fault Isolation**

- **Fulfillment failures don't crash orders**: Order workflow continues if fulfillment fails
- **Independent retry logic**: Each workflow has its own retry strategy
- **Graceful degradation**: System remains operational even if one part fails

### **Operational Flexibility**

- **Pause/resume fulfillment**: Without affecting payment processing
- **Update shipping address**: During active fulfillment
- **Cancel independently**: Either workflow can be cancelled without tight coupling
- **Monitor separately**: Independent metrics and logging per workflow

## 🛠️ Development Notes

### Signal Design Patterns

- **Idempotent signals**: Safe to send multiple times
- **State-based handlers**: Update workflow state in signal handlers
- **Conditional execution**: Use `condition()` to wait for signals

### Loosely Coupled Best Practices

- **Unique workflow IDs**: Prevent conflicts with timestamps
- **Activity-based communication**: All inter-workflow communication through activities
- **Polling strategy**: Use reasonable sleep intervals (5s in this example)
- **Query patterns**: Workflows expose state through queries, accessed via activities

## 📋 Comparison: Tight vs Loose Coupling

### **Tight Coupling (startChild)**

```typescript
// Start child workflow with direct handle
const handle = await startChild(fulfillmentWorkflow, {...});

// Send signals directly
await handle.signal(pauseSignal);

// Wait for result
const result = await handle.result();
```

**Pros**: Simple, direct communication  
**Cons**: Lifecycle coupling, scaling limitations, fault propagation

### **Loose Coupling (Activity + Signals)**

```typescript
// Start independent workflow via activity
const result = await workflowActivities.startFulfillmentWorkflow({...});
const workflowId = result.fulfillmentWorkflowId;

// Send signals via activity
await workflowActivities.signalFulfillmentWorkflow({
  workflowId,
  signalName: "pause",
  args: []
});

// Poll for status
while (!complete) {
  await sleep("5s");
  status = await workflowActivities.queryFulfillmentStatus(workflowId);
}
```

**Pros**: Independent scaling, fault isolation, flexible deployment  
**Cons**: Slightly more complex, requires polling

## 🎓 When to Use This Pattern

**Use Loosely Coupled Pattern When:**

- Workflows need independent scaling
- Different teams own different workflows
- Need fault isolation between workflows
- Want to deploy workflows independently
- Workflows have different SLAs or priorities

**Use Tight Coupling When:**

- Simple parent-child relationships
- Workflows always deployed together
- Need immediate failure propagation
- Simpler debugging and monitoring needs

This implementation showcases how `nestjs-temporal-core` makes it easy to build complex, signal-driven workflows with true independence while maintaining clean separation of concerns and robust error handling.
