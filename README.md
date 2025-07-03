# NestJS Temporal Core Example

A comprehensive example demonstrating the `nestjs-temporal-core` package with a complete order management workflow. This implementation showcases production-ready patterns for integrating Temporal workflows with NestJS applications.

## ✨ Features

- **End-to-end Order Workflow**: Payment, inventory, and email steps with compensation logic
- **REST API**: Create, track, cancel, and update orders
- **Real-time Progress**: Query workflow status and progress
- **Error Handling**: Retries and compensation for failures
- **Docker & Temporal**: One-command setup for local development

---

## 🚀 Quick Demo Walkthrough

### 1. Start Temporal and the App

```bash
npm install
npm run temporal:up         # Start Temporal server (Docker)
npm run start:dev           # Start NestJS app (port 3232)
```

- Temporal Web UI: http://localhost:8088
- API Docs (Swagger): http://localhost:3232/api

### 2. Create a Demo Order

```bash
curl -X POST http://localhost:3232/orders/demo
```

- This triggers the full order workflow with fake data.

### 3. Check Order Status

```bash
curl http://localhost:3232/orders/ORDER-{timestamp}/status
```

- Replace `{timestamp}` with the orderId from the previous response.

### 4. Cancel or Update Shipping (Optional)

```bash
curl -X PATCH http://localhost:3232/orders/ORDER-{timestamp}/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason": "Customer requested cancellation"}'

curl -X PATCH http://localhost:3232/orders/ORDER-{timestamp}/shipping \
  -H "Content-Type: application/json" \
  -d '{"street": "123 Main St", "city": "Boston", ...}'
```

---

## 🔄 Order Workflow Steps

1. **Validation**: Validate order data
2. **Inventory Reservation**: Reserve products
3. **Payment Processing**: Process payment (with retries)
4. **Inventory Confirmation**: Confirm allocation
5. **Email Notification**: Send confirmation email
6. **Shipping Preparation**: Simulate shipping (30s delay)
7. **Shipping Notification**: Send shipping email
8. **Completion**: Mark order as complete

- **Compensation**: Refunds and inventory release on failure
- **Signals/Queries**: Cancel, update shipping, and track progress in real time

---

## 🐳 Docker/Temporal Setup

The project includes a `docker-compose.yml` for easy Temporal development:

```bash
npm run temporal:up      # Start Temporal server and web UI
npm run temporal:logs    # View Temporal server logs
npm run temporal:down    # Stop Temporal services
```

- Web UI: http://localhost:8088
- Temporal server: localhost:7233

---

## 📡 API Endpoints (Key Examples)

| Endpoint                     | Method | Description                      |
| ---------------------------- | ------ | -------------------------------- |
| `/orders/demo`               | POST   | Create a demo order (quick test) |
| `/orders`                    | POST   | Create a custom order            |
| `/orders/{orderId}/status`   | GET    | Get order status & progress      |
| `/orders/{orderId}/cancel`   | PATCH  | Cancel an order                  |
| `/orders/{orderId}/shipping` | PATCH  | Update shipping address          |
| `/orders/demo/products`      | GET    | Get demo product catalog         |

---

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

---

## 🛠️ Development Scripts

```bash
npm run start:dev          # Development server with hot reload
npm run build              # Build for production
npm run start              # Start production server
npm run temporal:up        # Start Temporal with Docker
npm run temporal:down      # Stop Temporal services
npm run temporal:logs      # View Temporal server logs
npm run test:order         # Run automated order workflow test
npm run lint               # Lint TypeScript files
npm run format             # Format code with Prettier
```

---

## 🌍 Environment Configuration

- See `.env.example` for all options
- By default, runs on port 3232 and connects to Temporal at `localhost:7233`

---

## 🔍 Monitoring & Debugging

- **Swagger UI**: http://localhost:3232/api
- **Temporal Web UI**: http://localhost:8088
- **Application Logs**: See console for workflow step logs

---

## 🎯 Key Learning Points

- Temporal workflows, activities, signals, and queries
- Clean NestJS integration and architecture
- Error handling, compensation, and monitoring
- Realistic order processing demo

---
