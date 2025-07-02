import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsNumber, IsArray, ValidateNested, Min } from "class-validator";
import { Type } from "class-transformer";

export class OrderItemDto {
  @ApiProperty({ example: "PROD-001", description: "Product identifier" })
  @IsString()
  productId: string;

  @ApiProperty({ example: 2, description: "Quantity to order" })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 29.99, description: "Price per item" })
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: "CUSTOMER-123", description: "Customer identifier" })
  @IsString()
  customerId: string;

  @ApiProperty({ example: "customer@example.com", description: "Customer email for notifications" })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ type: [OrderItemDto], description: "Items to order" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 59.98, description: "Total order amount" })
  @IsNumber()
  @Min(0)
  totalAmount: number;
}

export class CancelOrderDto {
  @ApiProperty({ example: "Customer requested cancellation", description: "Reason for cancellation" })
  @IsString()
  reason: string;
}

export class UpdateShippingDto {
  @ApiProperty({ example: "123 Main St", description: "Street address" })
  @IsString()
  street: string;

  @ApiProperty({ example: "New York", description: "City" })
  @IsString()
  city: string;

  @ApiProperty({ example: "NY", description: "State" })
  @IsString()
  state: string;

  @ApiProperty({ example: "10001", description: "ZIP code" })
  @IsString()
  zipCode: string;

  @ApiProperty({ example: "USA", description: "Country" })
  @IsString()
  country: string;
}