import { Injectable } from "@nestjs/common";
import { Activity, ActivityMethod } from "nestjs-temporal-core";

@Injectable()
@Activity()
export class PaymentActivities {
  @ActivityMethod()
  async processPayment(
    orderId: string,
    customerId: string,
    amount: number
  ): Promise<string> {
    console.log(`💳 Processing payment for order ${orderId}: $${amount}`);

    // Simulate payment processing time
    await this.delay(2000);

    // Simulate payment failures
    if (Math.random() < 0.1) {
      throw new Error("Payment declined - insufficient funds");
    }

    if (Math.random() < 0.05) {
      throw new Error("Payment gateway timeout");
    }

    const paymentId = `PAY-${orderId}-${Date.now()}`;
    console.log(`✅ Payment processed successfully: ${paymentId}`);

    return paymentId;
  }

  @ActivityMethod()
  async refundPayment(paymentId: string): Promise<string> {
    console.log(`🔄 Processing refund for payment ${paymentId}`);

    await this.delay(1500);

    // Simulate refund failures
    if (Math.random() < 0.02) {
      throw new Error("Refund failed - payment not found");
    }

    const refundId = `REF-${paymentId}-${Date.now()}`;
    console.log(`✅ Refund processed successfully: ${refundId}`);

    return refundId;
  }

  @ActivityMethod()
  async verifyPayment(paymentId: string): Promise<boolean> {
    console.log(`🔍 Verifying payment ${paymentId}`);

    await this.delay(500);

    // Simulate verification result
    const isValid = Math.random() > 0.01;
    console.log(
      `${isValid ? "✅" : "❌"} Payment verification result: ${isValid}`
    );

    return isValid;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
