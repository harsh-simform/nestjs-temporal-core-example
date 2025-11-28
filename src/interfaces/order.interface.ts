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

// Order data interface
export interface OrderData {
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
}

// Order status interface
export interface OrderStatus {
  orderId: string;
  status:
    | "PENDING"
    | "PAYMENT_PROCESSING"
    | "PAYMENT_CONFIRMED"
    | "INVENTORY_RESERVED"
    | "CONFIRMED"
    | "SHIPPING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "FAILED";
  currentStep: string;
  paymentId?: string;
  reservationIds: string[];
  trackingNumber?: string;
  cancellationReason?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order progress interface
export interface OrderProgress {
  orderId: string;
  currentStep: number;
  totalSteps: number;
  stepName: string;
  percentage: number;
  estimatedCompletion?: Date;
}
