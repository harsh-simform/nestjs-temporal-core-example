import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { OrderService } from "../services/order.service";

@ApiTags("orders")
@Controller("orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: "Create a new order" })
  @ApiResponse({ status: 201, description: "Order created successfully" })
  async createOrder(@Body() orderData: any) {
    return this.orderService.createOrder(orderData);
  }

  @Get(":orderId/status")
  @ApiOperation({ summary: "Get order status" })
  async getOrderStatus(@Param("orderId") orderId: string) {
    return this.orderService.getOrderStatus(orderId);
  }

  @Patch(":orderId/cancel")
  @ApiOperation({ summary: "Cancel an order" })
  async cancelOrder(
    @Param("orderId") orderId: string,
    @Body() body: { reason: string }
  ) {
    return this.orderService.cancelOrder(orderId, body.reason);
  }

  @Patch(":orderId/shipping")
  @ApiOperation({ summary: "Update shipping address" })
  async updateShipping(
    @Param("orderId") orderId: string,
    @Body() address: any
  ) {
    return this.orderService.updateShippingAddress(orderId, address);
  }

  @Get()
  @ApiOperation({ summary: "List orders" })
  async listOrders(@Query("customer") customerId?: string) {
    return this.orderService.listOrders(customerId);
  }

  @Get("history/:customerId")
  @ApiOperation({ summary: "Get order history for a customer" })
  async getOrderHistory(@Param("customerId") customerId: string) {
    return this.orderService.getOrderHistory(customerId);
  }
}
