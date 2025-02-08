import { Injectable, Logger } from "@nestjs/common";
import { TemporalClientService } from "nestjs-temporal-core";
import { ConfigService } from "@nestjs/config";
import { IAuthResponse } from "./interfaces/auth.interface";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly temporalClient: TemporalClientService,
    private readonly configService: ConfigService
  ) {}

  async validateToken(): Promise<IAuthResponse> {
    try {
      const {
        handle: handle1,
        result: result1,
        workflowId: workflowId1,
      } = await this.temporalClient.startWorkflow<IAuthResponse, [string]>(
        "validateTokenWorkflow1",
        ["hello"],
        {
          taskQueue:
            this.configService.get<string>("TEMPORAL_TASK_QUEUE") || "",
        }
      );
      console.log("🚀 ~ AuthService ~ validateToken ~ result1:", await result1);

      const {
        handle: handle2,
        result: result2,
        workflowId: workflowId2,
      } = await this.temporalClient.startWorkflow<IAuthResponse, [string]>(
        "validateTokenWorkflow2",
        ["hello"],
        {
          taskQueue:
            this.configService.get<string>("TEMPORAL_TASK_QUEUE") || "",
        }
      );
      console.log("🚀 ~ AuthService ~ validateToken ~ result2:", await result2);

      return await result1;
    } catch (error) {
      this.logger.error("Error validating token:", error);
      throw error;
    }
  }
}
