import { Injectable } from "@nestjs/common";
import { Activity, ActivityMethod } from "nestjs-temporal-core";

@Injectable()
@Activity()
export class EmailActivities {
  @ActivityMethod()
  async sendOrderConfirmation(
    email: string,
    orderId: string,
    paymentId: string
  ): Promise<boolean> {
    console.log(
      `📧 Sending order confirmation to ${email} for order ${orderId}`
    );

    // Simulate email sending
    await this.delay(1000);

    // Simulate occasional email failures
    if (Math.random() < 0.05) {
      throw new Error("Email service temporarily unavailable");
    }

    console.log(`✅ Order confirmation sent successfully`);
    return true;
  }

  @ActivityMethod()
  async sendShippingNotification(
    email: string,
    orderId: string,
    shippingId: string
  ): Promise<void> {
    console.log(
      `📦 Sending shipping notification to ${email} for order ${orderId}`
    );

    await this.delay(800);

    console.log(
      `✅ Shipping notification sent with tracking ID: ${shippingId}`
    );
  }


  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
