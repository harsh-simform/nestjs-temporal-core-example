import { Injectable, Logger } from "@nestjs/common";
import { TemporalService } from "nestjs-temporal-core";
import {
  OrderData,
  OrderStatus,
  OrderProgress,
} from "../workflows/order.workflow";
import {
  FulfillmentStatus,
  FulfillmentProgress,
  type ShippingAddress,
} from "../workflows/fulfillment.workflow";

export interface CreateOrderDto {
  customerId: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private readonly temporal: TemporalService) {}

  async createOrder(
    createOrderDto: CreateOrderDto
  ): Promise<{ orderId: string; workflowId: string }> {
    const orderId = this.generateOrderId();
    const workflowId = `order-workflow-${orderId}`;

    const orderData: OrderData = {
      orderId,
      totalAmount: this.calculateTotal(createOrderDto.items),
      ...createOrderDto,
    };

    this.logger.log(
      `Creating order ${orderId} for customer ${createOrderDto.customerId}`
    );

    try {
      await this.temporal.startWorkflow("processOrderWorkflow", [orderData], {
        workflowId,
        taskQueue: "order-processing",
      });

      this.logger.log(`Order workflow started: ${workflowId}`);

      return {
        orderId,
        workflowId,
      };
    } catch (error) {
      this.logger.error(`Failed to start order workflow: ${error.message}`);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  async getOrderStatus(workflowId: string): Promise<OrderStatus> {
    try {
      const status = await this.temporal.queryWorkflow<OrderStatus>(
        workflowId,
        "getOrderStatus"
      );

      return status;
    } catch (error) {
      this.logger.error(
        `Failed to get order status for workflow ${workflowId}: ${error.message}`
      );
      throw new Error(`Failed to get order status: ${error.message}`);
    }
  }

  async getOrderProgress(workflowId: string): Promise<OrderProgress> {
    try {
      const progress = await this.temporal.queryWorkflow<OrderProgress>(
        workflowId,
        "getOrderProgress"
      );

      return progress;
    } catch (error) {
      this.logger.error(
        `Failed to get order progress for workflow ${workflowId}: ${error.message}`
      );
      throw new Error(`Failed to get order progress: ${error.message}`);
    }
  }

  async cancelOrder(workflowId: string, reason: string): Promise<void> {
    try {
      await this.temporal.signalWorkflow(workflowId, "cancelOrder", [reason]);

      this.logger.log(
        `Cancel signal sent to workflow ${workflowId}: ${reason}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to cancel order ${workflowId}: ${error.message}`
      );
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }

  async updateOrder(
    workflowId: string,
    updates: Partial<OrderData>
  ): Promise<void> {
    try {
      await this.temporal.signalWorkflow(workflowId, "updateOrder", [updates]);

      this.logger.log(`Update signal sent to workflow ${workflowId}`);
    } catch (error) {
      this.logger.error(
        `Failed to update order ${workflowId}: ${error.message}`
      );
      throw new Error(`Failed to update order: ${error.message}`);
    }
  }

  async listActiveOrders(): Promise<
    Array<{ workflowId: string; status: string }>
  > {
    try {
      // In a real implementation, you might use Temporal's list workflow API
      // For now, return empty array as this requires additional setup
      return [];
    } catch (error) {
      this.logger.error(`Failed to list active orders: ${error.message}`);
      throw new Error(`Failed to list active orders: ${error.message}`);
    }
  }

  // Fulfillment control methods
  async pauseOrderFulfillment(workflowId: string): Promise<void> {
    try {
      await this.temporal.signalWorkflow(
        workflowId,
        "pauseOrderFulfillment",
        []
      );
      this.logger.log(
        `Pause fulfillment signal sent to workflow ${workflowId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to pause fulfillment for order ${workflowId}: ${error.message}`
      );
      throw new Error(`Failed to pause fulfillment: ${error.message}`);
    }
  }

  async resumeOrderFulfillment(workflowId: string): Promise<void> {
    try {
      await this.temporal.signalWorkflow(
        workflowId,
        "resumeOrderFulfillment",
        []
      );
      this.logger.log(
        `Resume fulfillment signal sent to workflow ${workflowId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to resume fulfillment for order ${workflowId}: ${error.message}`
      );
      throw new Error(`Failed to resume fulfillment: ${error.message}`);
    }
  }

  async getFulfillmentStatus(
    fulfillmentWorkflowId: string
  ): Promise<FulfillmentStatus> {
    try {
      const status = await this.temporal.queryWorkflow<FulfillmentStatus>(
        fulfillmentWorkflowId,
        "getFulfillmentStatus"
      );
      return status;
    } catch (error) {
      this.logger.error(
        `Failed to get fulfillment status for workflow ${fulfillmentWorkflowId}: ${error.message}`
      );
      throw new Error(`Failed to get fulfillment status: ${error.message}`);
    }
  }

  async getFulfillmentProgress(
    fulfillmentWorkflowId: string
  ): Promise<FulfillmentProgress> {
    try {
      const progress = await this.temporal.queryWorkflow<FulfillmentProgress>(
        fulfillmentWorkflowId,
        "getFulfillmentProgress"
      );
      return progress;
    } catch (error) {
      this.logger.error(
        `Failed to get fulfillment progress for workflow ${fulfillmentWorkflowId}: ${error.message}`
      );
      throw new Error(`Failed to get fulfillment progress: ${error.message}`);
    }
  }

  async updateShippingAddress(
    fulfillmentWorkflowId: string,
    newAddress: ShippingAddress
  ): Promise<void> {
    try {
      await this.temporal.signalWorkflow(
        fulfillmentWorkflowId,
        "updateShippingAddress",
        [newAddress]
      );
      this.logger.log(
        `Shipping address update signal sent to fulfillment workflow ${fulfillmentWorkflowId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to update shipping address for fulfillment ${fulfillmentWorkflowId}: ${error.message}`
      );
      throw new Error(`Failed to update shipping address: ${error.message}`);
    }
  }

  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `ORD-${timestamp}-${random.toUpperCase()}`;
  }

  private calculateTotal(
    items: Array<{ quantity: number; price: number }>
  ): number {
    return items.reduce((total, item) => total + item.quantity * item.price, 0);
  }

  // Demo helper method
  async createDemoOrder(): Promise<{ orderId: string; workflowId: string }> {
    const demoOrder: CreateOrderDto = {
      customerId: "demo-customer-001",
      customerEmail: "demo@example.com",
      customerName: "Demo Customer",
      items: [
        {
          productId: "product-1",
          productName: "Awesome Widget",
          quantity: 2,
          price: 29.99,
        },
        {
          productId: "product-2",
          productName: "Super Gadget",
          quantity: 1,
          price: 79.99,
        },
      ],
      shippingAddress: {
        street: "123 Demo Street",
        city: "Demo City",
        state: "DC",
        zipCode: "12345",
        country: "USA",
      },
      paymentMethod: "credit_card",
    };

    return this.createOrder(demoOrder);
  }
}
