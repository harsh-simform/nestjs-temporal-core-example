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
      const { result, workflowId, handle } =
        await this.temporalClient.startWorkflow<IAuthResponse, [string]>(
          "validateTokenWorkflow",
          ["hello"],
          {
            taskQueue:
              this.configService.get<string>("TEMPORAL_TASK_QUEUE") || "",
          }
        );
      this.logger.debug("Started workflow", { workflowId });

      return await result;
    } catch (error) {
      this.logger.error("Error validating token:", error);
      throw error;
    }
  }
}
