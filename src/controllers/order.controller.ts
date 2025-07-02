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
import { CreateOrderDto, CancelOrderDto, UpdateShippingDto } from "../dto/order.dto";

@ApiTags("orders")
@Controller("orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: "Create a new order" })
  @ApiResponse({ status: 201, description: "Order created successfully" })
  @ApiResponse({ status: 400, description: "Invalid order data" })
  async createOrder(@Body() orderData: CreateOrderDto) {
    return this.orderService.createOrder(orderData);
  }

  @Get(":orderId/status")
  @ApiOperation({ summary: "Get order status" })
  async getOrderStatus(@Param("orderId") orderId: string) {
    return this.orderService.getOrderStatus(orderId);
  }

  @Patch(":orderId/cancel")
  @ApiOperation({ summary: "Cancel an order" })
  @ApiResponse({ status: 200, description: "Order cancellation requested" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async cancelOrder(
    @Param("orderId") orderId: string,
    @Body() body: CancelOrderDto
  ) {
    return this.orderService.cancelOrder(orderId, body.reason);
  }

  @Patch(":orderId/shipping")
  @ApiOperation({ summary: "Update shipping address" })
  @ApiResponse({ status: 200, description: "Shipping address updated" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async updateShipping(
    @Param("orderId") orderId: string,
    @Body() address: UpdateShippingDto
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
