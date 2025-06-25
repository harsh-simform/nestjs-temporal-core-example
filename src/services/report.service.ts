import { Injectable } from "@nestjs/common";
import { Cron, Interval } from "nestjs-temporal-core";
import { EmailActivities } from "../activities/email.activities";

@Injectable()
export class ReportService {
  constructor(private readonly emailActivities: EmailActivities) {}

  @Cron("0 8 * * *", {
    scheduleId: "daily-order-report",
    description: "Generate daily order report at 8 AM",
  })
  async generateDailyOrderReport(): Promise<void> {
    console.log("Generating daily order report...");

    try {
      // Generate report logic
      const reportData = await this.collectDailyOrderData();

      // Send report via email
      await this.emailActivities.sendDailyReport(
        "admin@company.com",
        reportData
      );

      console.log("Daily order report completed");
    } catch (error) {
      console.error("Failed to generate daily report:", error);

      // Send error alert
      await this.emailActivities.sendAlert(
        "admin@company.com",
        "Daily Report Generation Failed",
        { error: error.message, timestamp: new Date().toISOString() }
      );
    }
  }

  @Cron("0 0 1 * *", {
    scheduleId: "monthly-analytics",
    description: "Generate monthly analytics report",
  })
  async generateMonthlyAnalytics(): Promise<void> {
    console.log("Generating monthly analytics...");

    try {
      // Complex analytics processing
      await this.processMonthlyAnalytics();

      console.log("Monthly analytics completed");
    } catch (error) {
      console.error("Failed to generate monthly analytics:", error);

      // Send error alert
      await this.emailActivities.sendAlert(
        "admin@company.com",
        "Monthly Analytics Generation Failed",
        { error: error.message, timestamp: new Date().toISOString() }
      );
    }
  }

  @Interval("5m", {
    scheduleId: "system-health-check",
    description: "Check system health every 5 minutes",
  })
  async systemHealthCheck(): Promise<void> {
    console.log("Performing system health check...");

    try {
      // Health check logic
      const healthStatus = await this.checkSystemHealth();

      if (!healthStatus.healthy) {
        await this.emailActivities.sendAlert(
          "admin@company.com",
          "System Health Alert",
          healthStatus.issues
        );
        console.warn("System health issues detected:", healthStatus.issues);
      } else {
        console.log("System health check passed");
      }
    } catch (error) {
      console.error("Health check failed:", error);

      // Send critical alert
      await this.emailActivities.sendAlert(
        "admin@company.com",
        "Health Check System Failure",
        { error: error.message, timestamp: new Date().toISOString() }
      );
    }
  }

  private async collectDailyOrderData(): Promise<any> {
    // Simulate data collection with some processing time
    await this.delay(2000); // 2 seconds

    return {
      date: new Date().toISOString().split("T")[0],
      totalOrders: Math.floor(Math.random() * 100) + 50,
      totalRevenue: Math.floor(Math.random() * 10000) + 5000,
      avgOrderValue: Math.floor(Math.random() * 100) + 75,
      generatedAt: new Date().toISOString(),
    };
  }

  private async processMonthlyAnalytics(): Promise<void> {
    // Simulate complex analytics processing
    // In a real system, this might involve database queries, calculations, etc.
    console.log("Processing monthly data...");
    await this.delay(30000); // 30 seconds simulation
    console.log("Analytics processing completed");
  }

  private async checkSystemHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    timestamp: string;
    metrics: {
      memoryUsage: number;
      dbResponseTime: number;
      diskSpace: number;
    };
  }> {
    // Simulate health check with some delay
    await this.delay(1000); // 1 second

    const issues: string[] = [];

    // Simulate various health checks
    const memoryUsage = Math.random();
    const dbResponseTime = Math.random() * 1000; // ms
    const diskSpace = Math.random();

    if (memoryUsage > 0.85) {
      issues.push(
        `High memory usage detected: ${Math.round(memoryUsage * 100)}%`
      );
    }

    if (dbResponseTime > 500) {
      issues.push(
        `Database response time slow: ${Math.round(dbResponseTime)}ms`
      );
    }

    if (diskSpace < 0.1) {
      issues.push(`Low disk space: ${Math.round(diskSpace * 100)}% remaining`);
    }

    // Random additional issues for demo
    if (Math.random() < 0.05) {
      issues.push("External service connectivity issues");
    }

    return {
      healthy: issues.length === 0,
      issues,
      timestamp: new Date().toISOString(),
      metrics: {
        memoryUsage: Math.round(memoryUsage * 100),
        dbResponseTime: Math.round(dbResponseTime),
        diskSpace: Math.round(diskSpace * 100),
      },
    };
  }

  /**
   * Helper method to replace Temporal's sleep() function
   * since we're now in a regular NestJS service, not a Temporal workflow
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
