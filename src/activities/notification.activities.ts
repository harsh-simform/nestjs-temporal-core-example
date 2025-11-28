import { Injectable, Logger } from "@nestjs/common";
import { Activity, ActivityMethod } from "nestjs-temporal-core";
import {
  NotificationActivities,
  NotificationData,
  NotificationResult,
} from "src/interfaces/notification.interface";

@Injectable()
@Activity({ name: "notification-activities" })
export class NotificationActivityService implements NotificationActivities {
  private readonly logger = new Logger(NotificationActivityService.name);

  @ActivityMethod("send-sms")
  async sendSMS(
    phoneNumber: string,
    message: string
  ): Promise<NotificationResult> {
    this.logger.log(`Sending SMS to ${phoneNumber}: ${message}`);

    // Simulate SMS sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate SMS success/failure (95% success rate)
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
      const result: NotificationResult = {
        notificationId: `sms_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        status: "SENT",
        channel: "SMS",
        sentAt: new Date(),
      };

      this.logger.log(`SMS sent successfully: ${result.notificationId}`);
      return result;
    } else {
      const result: NotificationResult = {
        notificationId: "",
        status: "FAILED",
        channel: "SMS",
        error: "SMS service temporarily unavailable",
      };

      this.logger.error(`SMS failed: ${result.error}`);
      return result;
    }
  }

  @ActivityMethod({
    name: "send-push-notification",
    timeout: "30s",
    maxRetries: 3,
  })
  async sendPushNotification(
    userId: string,
    title: string,
    body: string
  ): Promise<NotificationResult> {
    this.logger.log(`Sending push notification to user ${userId}: ${title}`);

    // Simulate push notification delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result: NotificationResult = {
      notificationId: `push_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      status: "SENT",
      channel: "PUSH",
      sentAt: new Date(),
    };

    this.logger.log(
      `Push notification sent successfully: ${result.notificationId}`
    );
    return result;
  }

  @ActivityMethod()
  async sendInAppNotification(
    userId: string,
    notification: NotificationData
  ): Promise<NotificationResult> {
    this.logger.log(
      `Sending in-app notification to user ${userId}: ${notification.title}`
    );

    // Simulate in-app notification delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const result: NotificationResult = {
      notificationId: `inapp_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      status: "SENT",
      channel: "IN_APP",
      sentAt: new Date(),
    };

    this.logger.log(
      `In-app notification sent successfully: ${result.notificationId}`
    );
    return result;
  }

  @ActivityMethod("mark-notification-read")
  async markAsRead(notificationId: string): Promise<void> {
    this.logger.log(`Marking notification ${notificationId} as read`);

    // Simulate database update delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    this.logger.log(`Notification ${notificationId} marked as read`);
  }

  @ActivityMethod()
  async getNotificationHistory(userId: string): Promise<NotificationData[]> {
    this.logger.log(`Getting notification history for user ${userId}`);

    // Simulate database query delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Return mock notification history
    const history: NotificationData[] = [
      {
        userId,
        type: "PUSH",
        title: "Order Update",
        message: "Your order has been processed",
        metadata: { orderId: "ORD-123" },
      },
      {
        userId,
        type: "SMS",
        title: "Payment Confirmation",
        message: "Payment of $29.99 has been processed",
        metadata: { amount: 29.99 },
      },
    ];

    this.logger.log(
      `Retrieved ${history.length} notifications for user ${userId}`
    );
    return history;
  }
}
