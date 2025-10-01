import { Injectable, Logger } from "@nestjs/common";
import { Activity, ActivityMethod } from "nestjs-temporal-core";

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

@Injectable()
@Activity()
export class PaymentActivityService implements PaymentActivities {
  private readonly logger = new Logger(PaymentActivityService.name);

  @ActivityMethod()
  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    this.logger.log(
      `Processing payment for order ${paymentData.orderId}, amount: ${paymentData.amount} ${paymentData.currency}`
    );

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate payment success/failure (90% success rate)
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      const paymentResult: PaymentResult = {
        paymentId: `pay_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        status: "SUCCESS",
        transactionId: `txn_${Date.now()}`,
        amount: paymentData.amount,
        currency: paymentData.currency,
      };

      this.logger.log(
        `Payment successful for order ${paymentData.orderId}: ${paymentResult.paymentId}`
      );
      return paymentResult;
    } else {
      const paymentResult: PaymentResult = {
        paymentId: `pay_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        status: "FAILED",
        failureReason: "Insufficient funds",
        amount: paymentData.amount,
        currency: paymentData.currency,
      };

      this.logger.error(
        `Payment failed for order ${paymentData.orderId}: ${paymentResult.failureReason}`
      );
      return paymentResult;
    }
  }

  @ActivityMethod()
  async refundPayment(
    paymentId: string,
    amount: number
  ): Promise<PaymentResult> {
    this.logger.log(
      `Processing refund for payment ${paymentId}, amount: ${amount}`
    );

    // Simulate refund processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const refundResult: PaymentResult = {
      paymentId: `refund_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      status: "SUCCESS",
      transactionId: `refund_txn_${Date.now()}`,
      amount: amount,
      currency: "USD",
    };

    this.logger.log(
      `Refund successful for payment ${paymentId}: ${refundResult.paymentId}`
    );
    return refundResult;
  }

  @ActivityMethod()
  async verifyPayment(paymentId: string): Promise<PaymentResult> {
    this.logger.log(`Verifying payment ${paymentId}`);

    // Simulate verification delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simulate verification result
    const verificationResult: PaymentResult = {
      paymentId,
      status: "SUCCESS",
      transactionId: `verified_${Date.now()}`,
      amount: 0, // Would be fetched from payment system
      currency: "USD",
    };

    this.logger.log(`Payment verification completed for ${paymentId}`);
    return verificationResult;
  }
}
