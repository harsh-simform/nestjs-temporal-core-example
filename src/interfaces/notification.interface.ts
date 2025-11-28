export interface NotificationData {
  userId: string;
  type: "SMS" | "PUSH" | "IN_APP";
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  notificationId: string;
  status: "SENT" | "FAILED" | "PENDING";
  channel: string;
  sentAt?: Date;
  error?: string;
}

export interface NotificationActivities {
  sendSMS(phoneNumber: string, message: string): Promise<NotificationResult>;
  sendPushNotification(
    userId: string,
    title: string,
    body: string
  ): Promise<NotificationResult>;
  sendInAppNotification(
    userId: string,
    notification: NotificationData
  ): Promise<NotificationResult>;
  markAsRead(notificationId: string): Promise<void>;
  getNotificationHistory(userId: string): Promise<NotificationData[]>;
}
