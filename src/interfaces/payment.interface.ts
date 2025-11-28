export interface PaymentData {
  orderId: string;
  amount: number;
  currency: string;
  customerId: string;
  paymentMethod: string;
}

export interface PaymentResult {
  paymentId: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  transactionId?: string;
  failureReason?: string;
  amount: number;
  currency: string;
}

export interface PaymentActivities {
  processPayment(paymentData: PaymentData): Promise<PaymentResult>;
  refundPayment(paymentId: string, amount: number): Promise<PaymentResult>;
  verifyPayment(paymentId: string): Promise<PaymentResult>;
}
