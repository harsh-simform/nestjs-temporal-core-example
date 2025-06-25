# NestJS Temporal Example Application

A comprehensive example demonstrating the capabilities of the `nestjs-temporal-core` package.

## Features Demonstrated

- **Order Processing Workflow**: Complete order lifecycle with payment, inventory, and notifications
- **Scheduled Reports**: Automated daily/monthly reports using cron expressions
- **System Monitoring**: Health checks with interval-based scheduling
- **REST API Integration**: Standard NestJS controllers that interact with Temporal workflows
- **Error Handling**: Compensation logic and retry strategies
- **Signals & Queries**: Real-time workflow communication

## Quick Start

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start the Application**

   ```bash
   npm run start:dev
   ```

3. **View API Documentation**
   Open http://localhost:3000/api

## Testing the Application

### Create an Order

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUSTOMER-123",
    "customerEmail": "customer@example.com",
    "items": [
      {"productId": "PROD-001", "quantity": 2, "price": 29.99}
    ],
    "totalAmount": 59.98
  }'
```

### Check Order Status

```bash
curl http://localhost:3000/orders/ORDER-xxx/status
```

### Cancel an Order

```bash
curl -X PATCH http://localhost:3000/orders/ORDER-xxx/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason": "Customer requested cancellation"}'
```

### Admin Operations

```bash
# Get system status
curl http://localhost:3000/admin/system/status

# List schedules
curl http://localhost:3000/admin/schedules

# Trigger a schedule manually
curl -X POST http://localhost:3000/admin/schedules/daily-order-report/trigger

# Pause a schedule
curl -X PATCH http://localhost:3000/admin/schedules/daily-order-report/pause \
  -H "Content-Type: application/json" \
  -d '{"note": "Maintenance period"}'
```

## Project Structure

```
src/
├── workflows/           # Temporal workflow controllers
├── activities/          # Temporal activity implementations
├── controllers/         # REST API controllers
├── services/           # Business logic services
├── app.module.ts       # Main application module
└── main.ts            # Application bootstrap
```

## Key Features

### Auto-Discovery

All workflows and activities are automatically discovered using decorators:

- `@Activity()` for activity classes
- `@Cron()` and `@Interval()` for scheduled workflows

### Comprehensive Error Handling

- Automatic retries with configurable policies
- Compensation logic for failed workflows
- Graceful degradation for service failures

### Monitoring & Health Checks

- System status endpoints
- Schedule management APIs
- Discovery statistics and metrics

### Production Ready

- Proper logging and error handling
- Environment-based configuration
- Swagger API documentation
- Health check endpoints

This example demonstrates real-world usage patterns and best practices for building reliable distributed systems with NestJS and Temporal.
