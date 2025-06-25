import { Controller, Get, Post, Patch, Param, Body } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AdminService } from "../services/admin.service";

@ApiTags("admin")
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("system/status")
  @ApiOperation({ summary: "Get system status" })
  async getSystemStatus() {
    return this.adminService.getSystemStatus();
  }

  @Get("schedules")
  @ApiOperation({ summary: "List all managed schedules" })
  async listSchedules() {
    return this.adminService.listSchedules();
  }

  @Post("schedules/:scheduleId/trigger")
  @ApiOperation({ summary: "Trigger a schedule manually" })
  async triggerSchedule(@Param("scheduleId") scheduleId: string) {
    return this.adminService.triggerSchedule(scheduleId);
  }

  @Patch("schedules/:scheduleId/pause")
  @ApiOperation({ summary: "Pause a schedule" })
  async pauseSchedule(
    @Param("scheduleId") scheduleId: string,
    @Body() body: { note?: string }
  ) {
    return this.adminService.pauseSchedule(scheduleId, body.note);
  }

  @Patch("schedules/:scheduleId/resume")
  @ApiOperation({ summary: "Resume a schedule" })
  async resumeSchedule(
    @Param("scheduleId") scheduleId: string,
    @Body() body: { note?: string }
  ) {
    return this.adminService.resumeSchedule(scheduleId, body.note);
  }

  @Get("worker")
  @ApiOperation({ summary: "Get worker information and status" })
  async getWorkerInfo() {
    return this.adminService.getWorkerInfo();
  }

  @Get("discovery/stats")
  @ApiOperation({ summary: "Get discovery statistics" })
  async getDiscoveryStats() {
    return this.adminService.getDiscoveryStats();
  }
}
