import { Injectable, Logger } from "@nestjs/common";
import { Activity, ActivityMethod } from "nestjs-temporal-core";
import {
  EmailActivities,
  EmailResult,
  OrderEmailData,
} from "src/interfaces/email.interface";

@Injectable()
@Activity()
export class EmailActivityService implements EmailActivities {
  private readonly logger = new Logger(EmailActivityService.name);

  @ActivityMethod()
  async sendOrderConfirmation(orderData: OrderEmailData): Promise<EmailResult> {
    this.logger.log(
      `Sending order confirmation email for order ${orderData.orderId} to ${orderData.customerEmail}`
    );

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const emailContent = this.generateOrderConfirmationEmail(orderData);

    // Simulate email service (95% success rate)
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
      const result: EmailResult = {
        messageId: `msg_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        status: "SENT",
        recipient: orderData.customerEmail,
        sentAt: new Date(),
      };

      this.logger.log(
        `Order confirmation email sent successfully: ${result.messageId}`
      );
      return result;
    } else {
      const result: EmailResult = {
        messageId: "",
        status: "FAILED",
        recipient: orderData.customerEmail,
        sentAt: new Date(),
        error: "SMTP server temporarily unavailable",
      };

      this.logger.error(
        `Failed to send order confirmation email: ${result.error}`
      );
      return result;
    }
  }

  @ActivityMethod()
  async sendPaymentConfirmation(
    orderData: OrderEmailData
  ): Promise<EmailResult> {
    this.logger.log(
      `Sending payment confirmation email for order ${orderData.orderId} to ${orderData.customerEmail}`
    );

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const emailContent = this.generatePaymentConfirmationEmail(orderData);

    const result: EmailResult = {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "SENT",
      recipient: orderData.customerEmail,
      sentAt: new Date(),
    };

    this.logger.log(
      `Payment confirmation email sent successfully: ${result.messageId}`
    );
    return result;
  }

  @ActivityMethod()
  async sendShippingNotification(
    orderData: OrderEmailData & { trackingNumber: string }
  ): Promise<EmailResult> {
    this.logger.log(
      `Sending shipping notification for order ${orderData.orderId} to ${orderData.customerEmail}`
    );

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 900));

    const emailContent = this.generateShippingNotificationEmail(orderData);

    const result: EmailResult = {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "SENT",
      recipient: orderData.customerEmail,
      sentAt: new Date(),
    };

    this.logger.log(
      `Shipping notification sent successfully: ${result.messageId}`
    );
    return result;
  }

  @ActivityMethod()
  async sendOrderCancellation(
    orderData: OrderEmailData & { reason: string }
  ): Promise<EmailResult> {
    this.logger.log(
      `Sending order cancellation email for order ${orderData.orderId} to ${orderData.customerEmail}`
    );

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 700));

    const emailContent = this.generateOrderCancellationEmail(orderData);

    const result: EmailResult = {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "SENT",
      recipient: orderData.customerEmail,
      sentAt: new Date(),
    };

    this.logger.log(
      `Order cancellation email sent successfully: ${result.messageId}`
    );
    return result;
  }

  @ActivityMethod()
  async sendInventoryAlert(
    productId: string,
    currentStock: number
  ): Promise<EmailResult> {
    this.logger.log(
      `Sending inventory alert for product ${productId} (stock: ${currentStock})`
    );

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const result: EmailResult = {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "SENT",
      recipient: "inventory@example.com",
      sentAt: new Date(),
    };

    this.logger.log(`Inventory alert sent successfully: ${result.messageId}`);
    return result;
  }

  private generateOrderConfirmationEmail(orderData: OrderEmailData): string {
    return `
      Subject: Order Confirmation - ${orderData.orderId}
      
      Dear ${orderData.customerName},
      
      Thank you for your order! We've received your order and are processing it.
      
      Order Details:
      Order ID: ${orderData.orderId}
      Total Amount: $${orderData.totalAmount.toFixed(2)}
      
      Items:
      ${orderData.items
        .map(
          (item) =>
            `- ${item.productName} (Qty: ${item.quantity}) - $${(
              item.price * item.quantity
            ).toFixed(2)}`
        )
        .join("\n")}
      
      We'll send you another email when your order ships.
      
      Best regards,
      The Order Team
    `;
  }

  private generatePaymentConfirmationEmail(orderData: OrderEmailData): string {
    return `
      Subject: Payment Confirmed - ${orderData.orderId}
      
      Dear ${orderData.customerName},
      
      Your payment has been successfully processed!
      
      Order ID: ${orderData.orderId}
      Payment ID: ${orderData.paymentId}
      Amount Paid: $${orderData.totalAmount.toFixed(2)}
      
      Your order is now being prepared for shipment.
      
      Best regards,
      The Payment Team
    `;
  }

  private generateShippingNotificationEmail(
    orderData: OrderEmailData & { trackingNumber: string }
  ): string {
    return `
      Subject: Your Order Has Shipped - ${orderData.orderId}
      
      Dear ${orderData.customerName},
      
      Great news! Your order has been shipped.
      
      Order ID: ${orderData.orderId}
      Tracking Number: ${orderData.trackingNumber}
      
      You can track your package using the tracking number above.
      
      Best regards,
      The Shipping Team
    `;
  }

  private generateOrderCancellationEmail(
    orderData: OrderEmailData & { reason: string }
  ): string {
    return `
      Subject: Order Cancellation - ${orderData.orderId}
      
      Dear ${orderData.customerName},
      
      We're sorry to inform you that your order has been cancelled.
      
      Order ID: ${orderData.orderId}
      Cancellation Reason: ${orderData.reason}
      
      If payment was processed, a refund will be issued within 3-5 business days.
      
      Best regards,
      The Customer Service Team
    `;
  }
}
