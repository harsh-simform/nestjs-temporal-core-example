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

  @ActivityMethod()
  async sendDailyReport(email: string, reportData: any): Promise<void> {
    console.log(`📊 Sending daily report to ${email}`);
    console.log("Report data:", reportData);

    await this.delay(1500);

    console.log(`✅ Daily report sent successfully`);
  }

  @ActivityMethod()
  async sendAlert(email: string, subject: string, details: any): Promise<void> {
    console.log(`🚨 Sending alert to ${email}: ${subject}`);
    console.log("Alert details:", details);

    await this.delay(500);

    console.log(`✅ Alert sent successfully`);
  }

  @ActivityMethod()
  async sendWelcomeEmail(
    email: string,
    customerName: string
  ): Promise<boolean> {
    console.log(`👋 Sending welcome email to ${email} for ${customerName}`);

    await this.delay(1200);

    console.log(`✅ Welcome email sent successfully`);
    return true;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
