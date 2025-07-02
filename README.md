# NestJS Temporal Core Example

A clean, simple example demonstrating the `nestjs-temporal-core` package with a complete order management workflow.

## Features

- **Order Processing Workflow**: Complete order lifecycle with payment processing, inventory management, and email notifications
- **REST API Integration**: Standard NestJS controllers with Swagger documentation
- **Error Handling**: Retry strategies and compensation logic for failed workflows
- **Real-time Communication**: Workflow signals and queries for order status updates
- **Type Safety**: Full TypeScript support with proper DTOs and validation

## Prerequisites

- Node.js 18+ 
- [Temporal Server](https://docs.temporal.io/self-hosted-guide/setup) running locally (or Temporal Cloud account)

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd nestjs-temporal-core-example
   npm install
   ```

2. **Start Temporal Server** (if running locally)
   ```bash
   temporal server start-dev
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults work for local Temporal server)
   ```

4. **Start the Application**
   ```bash
   npm run start:dev
   ```

5. **View API Documentation**
   Open http://localhost:3000/api

## API Usage Examples

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
curl http://localhost:3000/orders/ORDER-{timestamp}/status
```

### Cancel an Order
```bash
curl -X PATCH http://localhost:3000/orders/ORDER-{timestamp}/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason": "Customer requested cancellation"}'
```

### Update Shipping Address
```bash
curl -X PATCH http://localhost:3000/orders/ORDER-{timestamp}/shipping \
  -H "Content-Type: application/json" \
  -d '{
    "street": "456 New St",
    "city": "Boston",
    "state": "MA", 
    "zipCode": "02101",
    "country": "USA"
  }'
```

## Project Structure

```
src/
├── activities/          # Temporal activities (payment, inventory, email)
├── workflows/           # Temporal workflows (order processing)
├── controllers/         # REST API controllers
├── services/           # Business logic services
├── dto/                # Data transfer objects
├── app.module.ts       # Main application module
└── main.ts            # Application bootstrap
```

## How It Works

1. **Order Creation**: POST to `/orders` starts a Temporal workflow
2. **Workflow Steps**: 
   - Validate order data
   - Reserve inventory 
   - Process payment
   - Confirm inventory reservation
   - Send confirmation email
   - Schedule shipping
   - Send shipping notification
3. **Real-time Updates**: Use queries to check status and signals to cancel/modify orders
4. **Error Handling**: Failed steps trigger compensation (refunds, inventory release)

## Temporal Integration

The example showcases key `nestjs-temporal-core` features:
- **Auto-discovery**: Activities are automatically registered using `@Activity()` decorator
- **Dependency Injection**: Activities can inject NestJS services
- **Type Safety**: Full TypeScript support for workflows and activities
- **Configuration**: Environment-based Temporal client configuration

## Development

```bash
# Development server with hot reload
npm run start:dev

# Build for production
npm run build

# Start production server
npm start
```

This example provides a solid foundation for building production-ready applications with NestJS and Temporal.
