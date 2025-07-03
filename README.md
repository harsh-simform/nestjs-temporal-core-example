# NestJS Temporal Core Example

A comprehensive example demonstrating the `nestjs-temporal-core` package with a complete order management workflow. This implementation showcases production-ready patterns for integrating Temporal workflows with NestJS applications.

## ✨ Features

- **🔄 Complete Order Processing Workflow**: End-to-end order lifecycle with payment processing, inventory management, and email notifications
- **🌐 REST API Integration**: Full CRUD operations with Swagger/OpenAPI documentation
- **⚡ Real-time Communication**: Workflow signals and queries for dynamic order updates
- **🛡️ Error Handling**: Comprehensive retry strategies and compensation logic for failed workflows
- **🔒 Type Safety**: Full TypeScript support with proper DTOs and validation
- **🎯 Production Ready**: Environment configuration, Docker support, and testing utilities
- **📊 Realistic Simulations**: Fake data generation with proper error scenarios for testing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- [Temporal Server](https://docs.temporal.io/self-hosted-guide/setup) running locally (or Temporal Cloud account)

### Installation & Setup

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd nestjs-temporal-core-example
   npm install
   ```

2. **Start Temporal Server**

   **Option A: Using Docker (Recommended)**

   ```bash
   npm run temporal:up
   ```

   **Option B: Local Installation**

   ```bash
   temporal server start-dev
   ```

3. **Configure Environment**

   ```bash
   cp .env.example .env
   # Edit .env if needed (configured for Temporal Cloud by default)
   ```

4. **Start the Application**

   ```bash
   npm run start:dev
   ```

5. **Test the Application**

   ```bash
   # Run automated order test
   npm run test:order

   # Or view API documentation at http://localhost:3232/api
   # Application runs on port 3232 by default
   ```

## 🐳 Docker Setup

The project includes a complete docker-compose.yml for easy Temporal development:

```bash
# Start all Temporal services (server + web UI)
npm run temporal:up

# View Temporal Web UI at http://localhost:8088
# View server logs
npm run temporal:logs

# Stop all services
npm run temporal:down
```

## 📡 API Usage Examples

### Create a Demo Order (Recommended for Testing)

```bash
curl -X POST http://localhost:3232/orders/demo
```

### Create a Custom Order

```bash
curl -X POST http://localhost:3232/orders \
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

### Check Order Status & Progress

```bash
curl http://localhost:3232/orders/ORDER-{timestamp}/status
```

### Cancel an Order

```bash
curl -X PATCH http://localhost:3232/orders/ORDER-{timestamp}/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason": "Customer requested cancellation"}'
```

### Update Shipping Address

```bash
curl -X PATCH http://localhost:3232/orders/ORDER-{timestamp}/shipping \
  -H "Content-Type: application/json" \
  -d '{
    "street": "456 New St",
    "city": "Boston",
    "state": "MA",
    "zipCode": "02101",
    "country": "USA"
  }'
```

### Get Demo Product Catalog

```bash
curl http://localhost:3232/orders/demo/products
```

## 🏗️ Project Structure

```
src/
├── activities/              # Temporal activities
│   ├── email.activities.ts  # Email notifications
│   ├── payment.activities.ts # Payment processing
│   └── inventory.activities.ts # Inventory management
├── workflows/               # Temporal workflows
│   ├── index.ts            # Workflow exports
│   └── order.workflow.ts   # Order processing workflow
├── controllers/            # REST API controllers
│   └── order.controller.ts # Order management endpoints
├── services/              # Business logic services
│   └── order.service.ts   # Order service integration
├── dto/                   # Data transfer objects
│   └── order.dto.ts       # Order DTOs with validation
├── interfaces/            # TypeScript interfaces
│   └── index.ts          # Shared interfaces
├── utils/                 # Utility functions
│   └── fake-data.ts      # Realistic fake data generation
├── app.module.ts         # Main application module
└── main.ts              # Application bootstrap
```

## 🔄 How It Works

### Order Processing Workflow

1. **Order Creation**: POST to `/orders` or `/orders/demo` starts a Temporal workflow
2. **Workflow Steps** (8 stages with progress tracking):

   - ✅ **Validation**: Validate order data and customer information
   - 📦 **Inventory Reservation**: Reserve products in inventory
   - 💳 **Payment Processing**: Process payment with retry logic
   - ✅ **Inventory Confirmation**: Confirm inventory allocation
   - 📧 **Email Notification**: Send order confirmation email
   - 🚚 **Shipping Preparation**: Schedule shipping (30s delay simulation)
   - 📬 **Shipping Notification**: Send shipping confirmation with tracking
   - 🎉 **Completion**: Order successfully processed

3. **Real-time Features**:
   - **Status Queries**: Track order progress (0-100%)
   - **Cancellation Signals**: Cancel orders at any stage
   - **Shipping Updates**: Update delivery address
   - **Compensation**: Automatic refunds and inventory release on failures

### Error Handling & Reliability

- **Automatic Retries**: Configurable retry strategies for each activity
- **Compensation Logic**: Refunds and inventory release for failed orders
- **Realistic Failures**: Simulated payment failures, inventory issues, and email problems
- **State Persistence**: Workflow state survives service restarts

## 🎯 Temporal Integration Features

This example demonstrates key `nestjs-temporal-core` capabilities:

- **🔍 Auto-discovery**: Activities automatically registered using `@Activity()` decorator
- **💉 Dependency Injection**: Activities can inject NestJS services and providers
- **🔒 Type Safety**: Full TypeScript support for workflows and activities
- **⚙️ Configuration**: Environment-based Temporal client configuration
- **🔧 Workflow Management**: Start, query, and signal workflows programmatically
- **📊 Monitoring**: Integration with Temporal Web UI for workflow monitoring

## 🛠️ Development Scripts

```bash
# Application
npm run start:dev          # Development server with hot reload
npm run start:debug        # Debug mode with inspector
npm run build              # Build for production
npm run start              # Start production server

# Temporal Services
npm run temporal:up        # Start Temporal with Docker
npm run temporal:down      # Stop Temporal services
npm run temporal:logs      # View Temporal server logs

# Testing & Quality
npm run test:order         # Run automated order workflow test
npm run lint              # Lint TypeScript files
npm run format            # Format code with Prettier
```

## 🌍 Environment Configuration

The application supports both local development and Temporal Cloud:

### Local Development (.env.example)

```env
# Application
PORT=3232
NODE_ENV=development

# Temporal (Local)
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=order-processing
```

### Temporal Cloud

```env
# Application
PORT=3232
NODE_ENV=production

# Temporal Cloud
TEMPORAL_ADDRESS=your-namespace.your-account.tmprl.cloud:7233
TEMPORAL_NAMESPACE=your-namespace.your-account
TEMPORAL_TASK_QUEUE=order-processing
TEMPORAL_TLS_CERT=your-base64-encoded-cert
TEMPORAL_TLS_KEY=your-base64-encoded-key
```

## 🔍 Monitoring & Debugging

- **Swagger UI**: http://localhost:3232/api - Complete API documentation
- **Temporal Web UI**: http://localhost:8088 - Workflow execution monitoring
- **Application Logs**: Structured logging for all workflow steps
- **Workflow History**: Complete execution history in Temporal UI

## 🎯 Key Learning Points

This example demonstrates:

1. **Temporal Fundamentals**: Workflows, activities, signals, and queries
2. **NestJS Integration**: Clean architecture with dependency injection
3. **Production Patterns**: Error handling, compensation, and monitoring
4. **Real-world Scenarios**: Order processing, payment handling, and inventory management
5. **Testing Strategies**: Automated testing with realistic data

## 🚀 Next Steps

To extend this example:

1. **Database Integration**: Add persistent storage for orders and customers
2. **Real Integrations**: Connect to actual payment gateways and inventory systems
3. **Advanced Features**: Implement workflow versioning and migration strategies
4. **Monitoring**: Add metrics, alerting, and observability tools
5. **Deployment**: Configure for production deployment with Docker and Kubernetes

This implementation provides a solid foundation for building production-ready applications with NestJS and Temporal!
This implementation provides a solid foundation for building production-ready applications with NestJS and Temporal!
