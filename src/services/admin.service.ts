import { Injectable } from "@nestjs/common";
import { TemporalService } from "nestjs-temporal-core";

@Injectable()
export class AdminService {
  constructor(private readonly temporal: TemporalService) {}

  async getSystemStatus() {
    const systemStatus = await this.temporal.getSystemStatus();
    const overallHealth = await this.temporal.getOverallHealth();

    return {
      ...systemStatus,
      health: overallHealth,
      timestamp: new Date().toISOString(),
    };
  }

  async listSchedules() {
    const schedules = this.temporal.getManagedSchedules();
    const stats = this.temporal.getScheduleStats();

    return {
      schedules,
      stats,
      totalManaged: schedules.length,
    };
  }

  async triggerSchedule(scheduleId: string) {
    try {
      await this.temporal.triggerSchedule(scheduleId);
      return {
        scheduleId,
        status: "triggered",
        message: "Schedule triggered successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        scheduleId,
        status: "failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async pauseSchedule(scheduleId: string, note?: string) {
    try {
      await this.temporal.pauseSchedule(scheduleId, note);
      return {
        scheduleId,
        status: "paused",
        note,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        scheduleId,
        status: "failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async resumeSchedule(scheduleId: string, note?: string) {
    try {
      await this.temporal.resumeSchedule(scheduleId, note);
      return {
        scheduleId,
        status: "resumed",
        note,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        scheduleId,
        status: "failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getDiscoveryStats() {
    const stats = this.temporal.getDiscoveryStats();
    const scheduleStats = this.temporal.getScheduleStats();

    return {
      discovery: stats,
      schedules: scheduleStats,
      managedSchedules: this.temporal.getManagedSchedules(),
      activities: {
        // Could add activity information here if needed
        message:
          "Activities are discovered automatically from @Activity decorated classes",
      },
    };
  }

  async getWorkerInfo() {
    const workerManager = this.temporal.getWorkerManager();

    if (!workerManager) {
      return {
        available: false,
        message: "Worker not available in client-only mode",
      };
    }

    const status = workerManager.getWorkerStatus();
    const activities = workerManager.getRegisteredActivities();
    const health = await workerManager.healthCheck();

    return {
      available: true,
      status,
      activities: {
        total: activities.length,
        list: activities,
      },
      health,
    };
  }
}
