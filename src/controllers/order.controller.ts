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
}
