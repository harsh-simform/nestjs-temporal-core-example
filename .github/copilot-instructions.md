# NestJS Temporal Core Example - AI Coding Assistant Instructions

This codebase demonstrates a production-ready NestJS application using the `nestjs-temporal-core` package for workflow orchestration. It implements a complete order management system with compensation logic, real-time progress tracking, and fault tolerance.

## 🏗️ Architecture Overview

**Core Integration Pattern**: NestJS + Temporal using the `nestjs-temporal-core` wrapper

- `src/app.module.ts`: Central configuration with `TemporalModule.registerAsync()`
- Activities are auto-discovered via `activityClasses` array in module config
- Workflows are loaded from `workflowsPath: require.resolve("./workflows")`
- Single task queue: `"order-processing"` (configurable via env)

**Package Integration (via yalc)**:

- Using local `nestjs-temporal-core` package for development
- Package provides: `@Activity()`, `@ActivityMethod()`, `TemporalService`, `TemporalModule`
- Seamless NestJS DI integration with Temporal.io

**Key Files**:

- `src/workflows/order.workflow.ts`: Main orchestration logic with signals/queries
- `src/activities/*.activities.ts`: Individual business operations (payment, inventory, email)
- `src/services/order.service.ts`: NestJS service that starts/manages workflows
- `src/controllers/order.controller.ts`: REST API endpoints

## 🔄 Temporal Patterns

### Workflow Structure

```typescript
// Signal/Query definitions (top-level exports)
export const cancelOrderSignal = defineSignal<[string]>("cancelOrder");
export const getOrderStatusQuery = defineQuery<any>("getOrderStatus");

// Activity proxies with specific timeouts/retries
const paymentActivities = proxyActivities<PaymentActivities>({
  startToCloseTimeout: "5m",
  retry: { maximumAttempts: 5 },
});
```

### Activity Implementation

- Use `@Injectable()` and `@Activity()` decorators from `nestjs-temporal-core`
- Mark methods with `@ActivityMethod()` for auto-discovery
- Include realistic delays and failure simulation for testing

### Service Integration

```typescript
// Start workflow
const { workflowId, result } = await this.temporal.startWorkflow(
  "processOrder", // Function name from workflow file
  [enhancedOrderData],
  { workflowId: `order-workflow-${orderId}` }
);

// Query workflow state
const status = await this.temporal.queryWorkflow(workflowId, "getOrderStatus");

// Send signals
await this.temporal.signalWorkflow(workflowId, "cancelOrder", [reason]);
```

## 🛠️ Development Workflow

**Essential Commands**:

```bash
npm run temporal:up      # Start Temporal + PostgreSQL via Docker
npm run start:dev        # Start NestJS with hot reload (port 3232)
npm run test:order       # Run automated workflow tests
```

**Key URLs**:

- Temporal Web UI: http://localhost:8088
- Swagger API: http://localhost:3232/api
- Demo endpoint: `POST /orders/demo` (creates test order)

**Docker Setup**: Complete Temporal server with PostgreSQL persistence. Services auto-start; check `docker-compose.yml` for port mappings (PostgreSQL on 5433 to avoid conflicts).

## 📋 Code Conventions

### File Organization

- `workflows/`: Pure Temporal workflow code (no NestJS dependencies)
- `activities/`: NestJS services with Temporal decorators
- `services/`: Business logic that orchestrates workflows
- `controllers/`: REST API layer only

### Naming Patterns

- Workflow IDs: `order-workflow-${orderId}`
- Activity timeouts: Payment (5m), Email (2m), Inventory (1m)
- Step naming: Use underscore format (`inventory_reservation`, `payment_processing`)

### Error Handling

- Workflows include compensation logic in catch blocks
- Activity failures trigger automatic retries (configured per activity type)
- State tracking via workflow variables (`status`, `currentStep`, `paymentId`)

## 🔍 Key Integration Points

**Environment Configuration**:

- `.env.local` takes precedence over `.env`
- TLS config conditional based on cert presence
- Default task queue: `"order-processing"`

**Fake Data Generator**: `src/utils/fake-data.ts` provides realistic test data for demos and testing.

**Progress Tracking**: Workflows expose real-time progress via queries, with step-based percentage calculation.

**Demo Focus**: This example demonstrates core `nestjs-temporal-core` features without unnecessary complexity:

- Order workflow with 8 clear steps (validation → completion)
- Activity retry patterns with different timeouts per service
- Signal/Query patterns for real-time interaction
- Compensation logic for failure scenarios
- REST API integration for workflow management

When adding new features, follow the established pattern: define activities as NestJS services, orchestrate in pure Temporal workflows, and expose via REST controllers that manage workflow lifecycle.
