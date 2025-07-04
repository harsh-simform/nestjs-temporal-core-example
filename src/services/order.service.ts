import { Injectable } from "@nestjs/common";
import { TemporalService } from "nestjs-temporal-core";
import { FakeDataGenerator } from "../utils/fake-data";

@Injectable()
export class OrderService {
  constructor(private readonly temporal: TemporalService) {}

  async createOrder(orderData: any) {
    const orderId = `ORDER-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

    const enhancedOrderData = {
      ...orderData,
      orderId,
      createdAt: new Date().toISOString(),
    };

    // Start the order processing workflow directly
    const { workflowId, result } = await this.temporal.startWorkflow(
      "processOrder", // This corresponds to the workflow function name in order.workflow.ts
      [enhancedOrderData],
      {
        taskQueue: process.env.TEMPORAL_TASK_QUEUE || "order-processing",
        workflowId: `order-workflow-${orderId}`,
        // Removed searchAttributes for now to test basic functionality
      }
    );

    return {
      orderId,
      workflowId,
      status: "processing",
      message: "Order created and processing started",
    };
  }

  async getOrderStatus(orderId: string) {
    const workflowId = `order-workflow-${orderId}`;

    try {
      const status = await this.temporal.queryWorkflow(
        workflowId,
        "getOrderStatus"
      );
      const progress = await this.temporal.queryWorkflow(
        workflowId,
        "getProgress"
      );

      return {
        orderId,
        workflowId,
        status,
        progress,
      };
    } catch (error) {
      return {
        orderId,
        workflowId,
        status: "not_found",
        error: "Order not found or workflow not running",
      };
    }
  }

  async cancelOrder(orderId: string, reason: string) {
    const workflowId = `order-workflow-${orderId}`;

    try {
      await this.temporal.signalWorkflow(workflowId, "cancelOrder", [reason]);

      return {
        orderId,
        status: "cancellation_requested",
        message: `Cancellation requested: ${reason}`,
      };
    } catch (error) {
      return {
        orderId,
        status: "cancellation_failed",
        error: error.message,
      };
    }
  }

  async updateShippingAddress(orderId: string, address: any) {
    const workflowId = `order-workflow-${orderId}`;

    try {
      await this.temporal.signalWorkflow(workflowId, "updateShipping", [
        address,
      ]);

      return {
        orderId,
        status: "shipping_updated",
        message: "Shipping address updated successfully",
      };
    } catch (error) {
      return {
        orderId,
        status: "update_failed",
        error: error.message,
      };
    }
  }

  async listOrders(customerId?: string) {
    const fakeOrders = FakeDataGenerator.generateOrderHistory(10);

    return {
      orders: fakeOrders.map((order) => ({
        orderId: order.orderId,
        customerId: customerId || order.customerId,
        status: ["completed", "processing", "shipped", "pending"][
          Math.floor(Math.random() * 4)
        ],
        totalAmount: order.totalAmount,
        createdAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        items: order.items,
        customerEmail: order.customerEmail,
      })),
    };
  }

  async getOrderHistory(customerId: string) {
    // This could use Temporal's list workflows API to get real order history
    try {
      const workflowClient = this.temporal.getClient().getWorkflowClient();

      if (workflowClient) {
        // Example of how you could list workflows for a customer
        const workflows = workflowClient.list({
          query: `WorkflowType = "processOrder" AND SearchAttributes["customer-id"] = "${customerId}"`,
          pageSize: 50,
        });

        const orderHistory = [];
        for await (const workflow of workflows) {
          orderHistory.push({
            workflowId: workflow.workflowId,
            status: workflow.status,
            startTime: workflow.startTime,
            // You could query each workflow for more details if needed
          });
        }

        return {
          customerId,
          orders: orderHistory,
          total: orderHistory.length,
        };
      }
    } catch (error) {
      console.warn(
        "Failed to fetch order history from Temporal:",
        error.message
      );
    }

    // Fallback to realistic fake data
    const fakeOrderHistory = FakeDataGenerator.generateOrderHistory(15);
    const ordersWithStatus = fakeOrderHistory.map((order) => ({
      ...FakeDataGenerator.generateOrderWithStatus(),
      customerId,
      orderId: order.orderId,
      items: order.items,
      totalAmount: order.totalAmount,
      customerEmail: order.customerEmail,
    }));

    return {
      customerId,
      orders: ordersWithStatus,
      total: ordersWithStatus.length,
      note: "Using realistic fake data - enable Temporal client for real order history",
    };
  }
}
