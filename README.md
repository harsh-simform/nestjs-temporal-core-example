# NestJS Temporal Core Example

This is a comprehensive example application demonstrating how to use the `nestjs-temporal-core` package for building robust, scalable applications with Temporal workflows.

## Features

- **Order Management Workflow**: Complete order processing with inventory, payment, and email notifications
- **Activity Services**: Modular activity implementations for payment, inventory, email, and notification operations
- **Decorator Demonstrations**: Comprehensive examples of all available decorators from nestjs-temporal-core
- **REST API**: Full REST API with Swagger documentation for order management and decorator demos
- **Health Monitoring**: Built-in health checks for Temporal services
- **Docker Support**: Easy setup with Docker Compose for Temporal server

## Architecture

### Workflows

- `processOrderWorkflow`: Main order processing workflow that orchestrates the entire order lifecycle
- `OrderWorkflowClass`: Workflow class demonstrating @SignalMethod, @QueryMethod decorators

### Activities

- `PaymentActivityService`: Handles payment processing and refunds
- `InventoryActivityService`: Manages inventory checks, reservations, and updates
- `EmailActivityService`: Sends various email notifications
- `NotificationActivityService`: Handles SMS, push, and in-app notifications

### Services

- `OrderService`: Business logic for order management using Temporal workflows
- `WorkflowDemoService`: Demonstrates direct activity execution and workflow operations

### Controllers

- `OrderController`: REST API endpoints for order operations
- `DecoratorDemoController`: REST API endpoints for decorator demonstrations

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Temporal Server

```bash
npm run temporal:up
```

This will start:

- Temporal server on `localhost:7233`
- Temporal UI on `http://localhost:8088`
- PostgreSQL database on `localhost:5433`

### 3. Configure Environment

Create a `.env` file in the root directory:

```env
# Temporal Configuration
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=order-processing

# Application Configuration
PORT=3000
NODE_ENV=development
```

### 4. Build and Start the Application

```bash
# Build the application
npm run build

# Start the application
npm start

# Or start in development mode
npm run start:dev
```

### 5. Access the Application

- **API**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/api
- **Temporal UI**: http://localhost:8088

## API Endpoints

### Orders

- `POST /orders` - Create a new order
- `POST /orders/demo` - Create a demo order for testing
- `GET /orders/:workflowId/status` - Get order status
- `GET /orders/:workflowId/progress` - Get order progress
- `DELETE /orders/:workflowId` - Cancel an order
- `PATCH /orders/:workflowId` - Update an order
- `GET /orders` - List active orders

### Service Demonstrations

- `POST /decorator-demo/activity-injection` - Demonstrate direct activity execution
- `POST /decorator-demo/workflow-client-injection` - Demonstrate workflow client usage
- `POST /decorator-demo/temporal-service-usage` - Demonstrate TemporalService usage
- `POST /decorator-demo/all-decorators` - Demonstrate all service features at once
- `GET /decorator-demo/decorator-info` - Get information about available decorators

### Health

- `GET /health` - Application health status
- `GET /health/temporal` - Temporal services health status

## Example Usage

### Create a Demo Order

```bash
curl -X POST http://localhost:3000/orders/demo
```

### Check Order Status

```bash
curl http://localhost:3000/orders/{workflowId}/status
```

### Cancel an Order

```bash
curl -X DELETE http://localhost:3000/orders/{workflowId} \
  -H "Content-Type: application/json" \
  -d '{"reason": "Customer requested cancellation"}'
```

### Demonstrate Decorators

```bash
# Demonstrate activity injection
curl -X POST http://localhost:3000/decorator-demo/activity-injection \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-123", "customerId": "customer-123", "message": "Activity injection demo"}'

# Demonstrate workflow client injection
curl -X POST http://localhost:3000/decorator-demo/workflow-client-injection \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-123", "customerId": "customer-123", "message": "Workflow client injection demo"}'

# Demonstrate all decorators
curl -X POST http://localhost:3000/decorator-demo/all-decorators \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-123", "customerId": "customer-123", "message": "All decorators demo"}'

# Get decorator information
curl http://localhost:3000/decorator-demo/decorator-info
```

## Decorators Demonstrated

This example showcases all available decorators from the `nestjs-temporal-core` package:

### Activity Decorators

- **@Activity**: Marks a class as a Temporal activity

  ```typescript
  @Activity({ name: "notification-activities" })
  export class NotificationActivityService {}
  ```

- **@ActivityMethod**: Marks a method as a Temporal activity method

  ```typescript
  @ActivityMethod("send-sms")
  async sendSMS(phoneNumber: string, message: string) { }
  ```

### Workflow Decorators

- **@SignalMethod**: Marks a method as a signal handler for the workflow

  ```typescript
  @SignalMethod("cancelOrder")
  async handleCancelOrder(reason: string) { }
  ```

- **@QueryMethod**: Marks a method as a query handler for the workflow

  ```typescript
  @QueryMethod("getOrderStatus")
  getOrderStatus(): OrderWorkflowState { }
  ```

## Workflow Lifecycle

1. **Order Received**: Workflow starts and validates order data
2. **Inventory Check**: Verifies product availability
3. **Inventory Reservation**: Reserves items for the order
4. **Payment Processing**: Processes payment with retry logic
5. **Payment Confirmation**: Confirms successful payment
6. **Order Confirmation**: Sends confirmation emails
7. **Shipping Preparation**: Prepares order for shipment
8. **Order Shipped**: Generates tracking number and sends notification

## Error Handling

The workflow includes comprehensive error handling:

- **Inventory Unavailable**: Releases reservations and fails gracefully
- **Payment Failure**: Refunds any processed payments
- **Order Cancellation**: Handles cancellation at any stage with proper compensation
- **Activity Failures**: Automatic retries with exponential backoff

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Monitoring

### Temporal UI

Access the Temporal UI at http://localhost:8088 to:

- View workflow executions
- Monitor activity performance
- Debug workflow issues
- View workflow history

### Health Checks

The application provides health check endpoints:

- `/health` - Overall application health
- `/health/temporal` - Temporal services health

## Configuration

### Temporal Configuration

The application uses the `TemporalModule` with the following configuration:

```typescript
TemporalModule.registerAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    connection: {
      address: configService.get("TEMPORAL_ADDRESS") || "localhost:7233",
      namespace: configService.get("TEMPORAL_NAMESPACE") || "default",
    },
    taskQueue: configService.get("TEMPORAL_TASK_QUEUE") || "order-processing",
    worker: {
      workflowsPath: require.resolve("./workflows"),
      activityClasses: [
        PaymentActivityService,
        InventoryActivityService,
        EmailActivityService,
      ],
      autoStart: true,
    },
    logLevel: "debug",
    enableLogger: true,
    autoRestart: true,
  }),
  inject: [ConfigService],
});
```

## Troubleshooting

### Common Issues

1. **Temporal Server Not Running**: Ensure Docker Compose is running with `npm run temporal:up`
2. **Connection Issues**: Check that `TEMPORAL_ADDRESS` matches your Temporal server
3. **Build Errors**: Ensure all dependencies are installed with `npm install`
4. **Workflow Not Starting**: Check that the worker is running and activities are registered

### Logs

View application logs:

```bash
npm run start:dev
```

View Temporal server logs:

```bash
npm run temporal:logs
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
