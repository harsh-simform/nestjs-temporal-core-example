import { faker } from "@faker-js/faker";
import { OrderData, InventoryItem } from "../interfaces";
import { CreateOrderDto, OrderItemDto } from "../dto/order.dto";

export class FakeDataGenerator {
  static generateProducts(count: number = 10): InventoryItem[] {
    return Array.from({ length: count }, () => ({
      productId: faker.string.alphanumeric({ length: 8, casing: "upper" }),
      quantity: faker.number.int({ min: 0, max: 100 }),
      price: parseFloat(faker.commerce.price({ min: 5, max: 500 })),
    }));
  }

  static generateOrderItems(
    availableProducts: InventoryItem[],
    maxItems: number = 5
  ): OrderItemDto[] {
    const itemCount = faker.number.int({ min: 1, max: maxItems });
    const selectedProducts = faker.helpers.arrayElements(
      availableProducts,
      itemCount
    );

    return selectedProducts.map((product) => ({
      productId: product.productId,
      quantity: faker.number.int({ min: 1, max: 5 }),
      price: product.price,
    }));
  }

  static generateCustomer() {
    return {
      customerId: faker.string.uuid(),
      customerEmail: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
      },
    };
  }

  static generateCreateOrderDto(
    availableProducts?: InventoryItem[]
  ): CreateOrderDto {
    const products = availableProducts || this.generateProducts(20);
    const customer = this.generateCustomer();
    const items = this.generateOrderItems(products);
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return {
      customerId: customer.customerId,
      customerEmail: customer.customerEmail,
      items,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };
  }

  static generateOrderData(availableProducts?: InventoryItem[]): OrderData {
    const createOrderDto = this.generateCreateOrderDto(availableProducts);

    return {
      orderId: faker.string.uuid(),
      ...createOrderDto,
    };
  }

  static generateOrderHistory(count: number = 10): OrderData[] {
    const products = this.generateProducts(30);
    return Array.from({ length: count }, () =>
      this.generateOrderData(products)
    );
  }

  static generateEcommerceProducts(count: number = 20) {
    return Array.from({ length: count }, () => ({
      productId: faker.string.alphanumeric({ length: 8, casing: "upper" }),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      category: faker.commerce.department(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
      quantity: faker.number.int({ min: 0, max: 200 }),
      brand: faker.company.name(),
      sku: faker.string.alphanumeric({ length: 12, casing: "upper" }),
      weight: faker.number.float({ min: 0.1, max: 50, multipleOf: 0.1 }),
      dimensions: {
        length: faker.number.float({ min: 1, max: 100, multipleOf: 0.1 }),
        width: faker.number.float({ min: 1, max: 100, multipleOf: 0.1 }),
        height: faker.number.float({ min: 1, max: 100, multipleOf: 0.1 }),
      },
      images: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
        faker.image.url({ width: 400, height: 400 })
      ),
      tags: Array.from({ length: faker.number.int({ min: 2, max: 8 }) }, () =>
        faker.commerce.productMaterial()
      ),
      rating: faker.number.float({ min: 1, max: 5, multipleOf: 0.1 }),
      reviewCount: faker.number.int({ min: 0, max: 1000 }),
      inStock: faker.datatype.boolean(),
      featured: faker.datatype.boolean(),
    }));
  }

  static generateRealisticOrderStatuses() {
    return [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ];
  }

  static generateOrderWithStatus() {
    const order = this.generateOrderData();
    const statuses = this.generateRealisticOrderStatuses();

    return {
      ...order,
      status: faker.helpers.arrayElement(statuses),
      createdAt: faker.date.recent({ days: 30 }),
      updatedAt: faker.date.recent({ days: 7 }),
      shippingAddress: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
      },
      paymentMethod: faker.helpers.arrayElement([
        "credit_card",
        "debit_card",
        "paypal",
        "apple_pay",
        "google_pay",
      ]),
      trackingNumber: faker.string.alphanumeric({
        length: 12,
        casing: "upper",
      }),
      estimatedDelivery: faker.date.future(),
    };
  }
}
