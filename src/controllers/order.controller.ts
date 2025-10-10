import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { OrderService, CreateOrderDto } from "../services/order.service";
import { OrderStatus, OrderProgress } from "../workflows/order.workflow";
import {
  FulfillmentStatus,
  FulfillmentProgress,
  type ShippingAddress,
} from "../workflows/fulfillment.workflow";

@ApiTags("orders")
@Controller("orders")
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: "Create a new order" })
  @ApiBody({
    description: "Order creation data",
    schema: {
      type: "object",
      properties: {
        customerId: { type: "string", example: "customer-123" },
        customerEmail: { type: "string", example: "customer@example.com" },
        customerName: { type: "string", example: "John Doe" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              productId: { type: "string", example: "product-1" },
              productName: { type: "string", example: "Widget" },
              quantity: { type: "number", example: 2 },
              price: { type: "number", example: 29.99 },
            },
          },
        },
        shippingAddress: {
          type: "object",
          properties: {
            street: { type: "string", example: "123 Main St" },
            city: { type: "string", example: "Anytown" },
            state: { type: "string", example: "ST" },
            zipCode: { type: "string", example: "12345" },
            country: { type: "string", example: "USA" },
          },
        },
        paymentMethod: { type: "string", example: "credit_card" },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Order created successfully",
    schema: {
      type: "object",
      properties: {
        orderId: { type: "string", example: "ORD-1703123456789-ABC123DEF" },
        workflowId: {
          type: "string",
          example: "order-workflow-ORD-1703123456789-ABC123DEF",
        },
        message: { type: "string", example: "Order created successfully" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid order data" })
  @ApiResponse({ status: 500, description: "Failed to create order" })
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    try {
      this.logger.log(
        `Creating order for customer: ${createOrderDto.customerId}`
      );

      const result = await this.orderService.createOrder(createOrderDto);

      return {
        ...result,
        message: "Order created successfully",
      };
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);
      throw new HttpException(
        `Failed to create order: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("demo")
  @ApiOperation({ summary: "Create a demo order for testing" })
  @ApiResponse({
    status: 201,
    description: "Demo order created successfully",
    schema: {
      type: "object",
      properties: {
        orderId: { type: "string" },
        workflowId: { type: "string" },
        message: { type: "string" },
      },
    },
  })
  async createDemoOrder() {
    try {
      this.logger.log("Creating demo order");

      const result = await this.orderService.createDemoOrder();

      return {
        ...result,
        message: "Demo order created successfully",
      };
    } catch (error) {
      this.logger.error(`Failed to create demo order: ${error.message}`);
      throw new HttpException(
        `Failed to create demo order: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(":workflowId/status")
  @ApiOperation({ summary: "Get order status" })
  @ApiParam({ name: "workflowId", description: "Workflow ID of the order" })
  @ApiResponse({
    status: 200,
    description: "Order status retrieved successfully",
    type: "object",
  })
  @ApiResponse({ status: 404, description: "Order not found" })
  async getOrderStatus(
    @Param("workflowId") workflowId: string
  ): Promise<OrderStatus> {
    try {
      this.logger.log(`Getting status for order workflow: ${workflowId}`);

      return await this.orderService.getOrderStatus(workflowId);
    } catch (error) {
      this.logger.error(`Failed to get order status: ${error.message}`);
      throw new HttpException(
        `Failed to get order status: ${error.message}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get(":workflowId/progress")
  @ApiOperation({ summary: "Get order progress" })
  @ApiParam({ name: "workflowId", description: "Workflow ID of the order" })
  @ApiResponse({
    status: 200,
    description: "Order progress retrieved successfully",
    type: "object",
  })
  @ApiResponse({ status: 404, description: "Order not found" })
  async getOrderProgress(
    @Param("workflowId") workflowId: string
  ): Promise<OrderProgress> {
    try {
      this.logger.log(`Getting progress for order workflow: ${workflowId}`);

      return await this.orderService.getOrderProgress(workflowId);
    } catch (error) {
      this.logger.error(`Failed to get order progress: ${error.message}`);
      throw new HttpException(
        `Failed to get order progress: ${error.message}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Delete(":workflowId")
  @ApiOperation({ summary: "Cancel an order" })
  @ApiParam({ name: "workflowId", description: "Workflow ID of the order" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        reason: { type: "string", example: "Customer requested cancellation" },
      },
      required: ["reason"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "Order cancelled successfully",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Order cancellation signal sent" },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Order not found" })
  async cancelOrder(
    @Param("workflowId") workflowId: string,
    @Body() body: { reason: string }
  ) {
    try {
      this.logger.log(
        `Cancelling order workflow: ${workflowId}, reason: ${body.reason}`
      );

      await this.orderService.cancelOrder(workflowId, body.reason);

      return {
        message: "Order cancellation signal sent",
      };
    } catch (error) {
      this.logger.error(`Failed to cancel order: ${error.message}`);
      throw new HttpException(
        `Failed to cancel order: ${error.message}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Patch(":workflowId")
  @ApiOperation({ summary: "Update an order" })
  @ApiParam({ name: "workflowId", description: "Workflow ID of the order" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        customerEmail: { type: "string", example: "newemail@example.com" },
        shippingAddress: {
          type: "object",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            zipCode: { type: "string" },
            country: { type: "string" },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Order updated successfully",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Order update signal sent" },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Order not found" })
  async updateOrder(
    @Param("workflowId") workflowId: string,
    @Body() updates: any
  ) {
    try {
      this.logger.log(`Updating order workflow: ${workflowId}`);

      await this.orderService.updateOrder(workflowId, updates);

      return {
        message: "Order update signal sent",
      };
    } catch (error) {
      this.logger.error(`Failed to update order: ${error.message}`);
      throw new HttpException(
        `Failed to update order: ${error.message}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get()
  @ApiOperation({ summary: "List active orders" })
  @ApiResponse({
    status: 200,
    description: "Active orders retrieved successfully",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          workflowId: { type: "string" },
          status: { type: "string" },
        },
      },
    },
  })
  async listActiveOrders() {
    try {
      this.logger.log("Listing active orders");

      const orders = await this.orderService.listActiveOrders();

      return {
        orders,
        count: orders.length,
      };
    } catch (error) {
      this.logger.error(`Failed to list active orders: ${error.message}`);
      throw new HttpException(
        `Failed to list active orders: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Fulfillment control endpoints
  @Post(":workflowId/fulfillment/pause")
  @ApiOperation({ summary: "Pause order fulfillment" })
  @ApiParam({ name: "workflowId", description: "Workflow ID of the order" })
  @ApiResponse({
    status: 200,
    description: "Fulfillment paused successfully",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Fulfillment paused" },
      },
    },
  })
  async pauseFulfillment(@Param("workflowId") workflowId: string) {
    try {
      this.logger.log(`Pausing fulfillment for order workflow: ${workflowId}`);
      await this.orderService.pauseOrderFulfillment(workflowId);
      return { message: "Fulfillment paused" };
    } catch (error) {
      this.logger.error(`Failed to pause fulfillment: ${error.message}`);
      throw new HttpException(
        `Failed to pause fulfillment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(":workflowId/fulfillment/resume")
  @ApiOperation({ summary: "Resume order fulfillment" })
  @ApiParam({ name: "workflowId", description: "Workflow ID of the order" })
  @ApiResponse({
    status: 200,
    description: "Fulfillment resumed successfully",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Fulfillment resumed" },
      },
    },
  })
  async resumeFulfillment(@Param("workflowId") workflowId: string) {
    try {
      this.logger.log(`Resuming fulfillment for order workflow: ${workflowId}`);
      await this.orderService.resumeOrderFulfillment(workflowId);
      return { message: "Fulfillment resumed" };
    } catch (error) {
      this.logger.error(`Failed to resume fulfillment: ${error.message}`);
      throw new HttpException(
        `Failed to resume fulfillment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("fulfillment/:fulfillmentWorkflowId/status")
  @ApiOperation({ summary: "Get fulfillment status" })
  @ApiParam({
    name: "fulfillmentWorkflowId",
    description: "Fulfillment workflow ID",
  })
  @ApiResponse({
    status: 200,
    description: "Fulfillment status retrieved successfully",
    type: "object",
  })
  async getFulfillmentStatus(
    @Param("fulfillmentWorkflowId") fulfillmentWorkflowId: string
  ): Promise<FulfillmentStatus> {
    try {
      this.logger.log(
        `Getting fulfillment status for workflow: ${fulfillmentWorkflowId}`
      );
      return await this.orderService.getFulfillmentStatus(
        fulfillmentWorkflowId
      );
    } catch (error) {
      this.logger.error(`Failed to get fulfillment status: ${error.message}`);
      throw new HttpException(
        `Failed to get fulfillment status: ${error.message}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get("fulfillment/:fulfillmentWorkflowId/progress")
  @ApiOperation({ summary: "Get fulfillment progress" })
  @ApiParam({
    name: "fulfillmentWorkflowId",
    description: "Fulfillment workflow ID",
  })
  @ApiResponse({
    status: 200,
    description: "Fulfillment progress retrieved successfully",
    type: "object",
  })
  async getFulfillmentProgress(
    @Param("fulfillmentWorkflowId") fulfillmentWorkflowId: string
  ): Promise<FulfillmentProgress> {
    try {
      this.logger.log(
        `Getting fulfillment progress for workflow: ${fulfillmentWorkflowId}`
      );
      return await this.orderService.getFulfillmentProgress(
        fulfillmentWorkflowId
      );
    } catch (error) {
      this.logger.error(`Failed to get fulfillment progress: ${error.message}`);
      throw new HttpException(
        `Failed to get fulfillment progress: ${error.message}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Patch("fulfillment/:fulfillmentWorkflowId/shipping-address")
  @ApiOperation({ summary: "Update shipping address for fulfillment" })
  @ApiParam({
    name: "fulfillmentWorkflowId",
    description: "Fulfillment workflow ID",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        street: { type: "string", example: "456 New Street" },
        city: { type: "string", example: "New City" },
        state: { type: "string", example: "NC" },
        zipCode: { type: "string", example: "54321" },
        country: { type: "string", example: "USA" },
      },
      required: ["street", "city", "state", "zipCode", "country"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "Shipping address updated successfully",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Shipping address updated" },
      },
    },
  })
  async updateShippingAddress(
    @Param("fulfillmentWorkflowId") fulfillmentWorkflowId: string,
    @Body() newAddress: ShippingAddress
  ) {
    try {
      this.logger.log(
        `Updating shipping address for fulfillment workflow: ${fulfillmentWorkflowId}`
      );
      await this.orderService.updateShippingAddress(
        fulfillmentWorkflowId,
        newAddress
      );
      return { message: "Shipping address updated" };
    } catch (error) {
      this.logger.error(`Failed to update shipping address: ${error.message}`);
      throw new HttpException(
        `Failed to update shipping address: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
