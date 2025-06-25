import { Controller } from "@nestjs/common";
import { sleep } from "@temporalio/workflow";
import {
  WorkflowController,
  WorkflowMethod,
  Cron,
  Interval,
} from "nestjs-temporal-core";
import { EmailActivities } from "src/activities/email.activities";

@Controller()
@WorkflowController({ taskQueue: "reports" })
export class ReportWorkflowController {
  constructor(private readonly emailActivities: EmailActivities) {}
  @Cron("0 8 * * *", {
    scheduleId: "daily-order-report",
    description: "Generate daily order report at 8 AM",
  })
  @WorkflowMethod()
  async generateDailyOrderReport(): Promise<void> {
    console.log("Generating daily order report...");

    // Generate report logic
    const reportData = await this.collectDailyOrderData();

    // Send report via email
    await this.emailActivities.sendDailyReport("admin@company.com", reportData);

    console.log("Daily order report completed");
  }

  @Cron("0 0 1 * *", {
    scheduleId: "monthly-analytics",
    description: "Generate monthly analytics report",
  })
  @WorkflowMethod()
  async generateMonthlyAnalytics(): Promise<void> {
    console.log("Generating monthly analytics...");

    // Complex analytics processing
    await this.processMonthlyAnalytics();

    console.log("Monthly analytics completed");
  }

  @Interval("5m", {
    scheduleId: "system-health-check",
    description: "Check system health every 5 minutes",
  })
  @WorkflowMethod()
  async systemHealthCheck(): Promise<void> {
    console.log("Performing system health check...");

    // Health check logic
    const healthStatus = await this.checkSystemHealth();

    if (!healthStatus.healthy) {
      await this.emailActivities.sendAlert(
        "admin@company.com",
        "System Health Alert",
        healthStatus.issues
      );
    }
  }

  private async collectDailyOrderData(): Promise<any> {
    // Simulate data collection
    return {
      date: new Date().toISOString().split("T")[0],
      totalOrders: Math.floor(Math.random() * 100) + 50,
      totalRevenue: Math.floor(Math.random() * 10000) + 5000,
      avgOrderValue: Math.floor(Math.random() * 100) + 75,
    };
  }

  private async processMonthlyAnalytics(): Promise<void> {
    // Simulate complex analytics processing
    await sleep("30s");
  }

  private async checkSystemHealth(): Promise<{
    healthy: boolean;
    issues: string[];
  }> {
    // Simulate health check
    const issues: string[] = [];

    // Random health issues for demo
    if (Math.random() < 0.1) {
      issues.push("High memory usage detected");
    }

    if (Math.random() < 0.05) {
      issues.push("Database connection slow");
    }

    return {
      healthy: issues.length === 0,
      issues,
    };
  }
}
