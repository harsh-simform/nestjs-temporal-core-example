import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import {
  TemporalWorkerModule,
  TemporalClientModule,
} from "nestjs-temporal-core";
import { TokenValidationActivity } from "./activities/token-validation.activity";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    // Register Temporal Worker
    TemporalWorkerModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        connection: {
          address: config.get<string>("TEMPORAL_HOST") || "",
          tls: {
            clientCertPair: {
              crt: Buffer.from(
                config.get<string>("TEMPORAL_CERT") || "",
                "base64"
              ),
              key: Buffer.from(
                config.get<string>("TEMPORAL_KEY") || "",
                "base64"
              ),
            },
          },
        },
        namespace: config.get<string>("TEMPORAL_NAMESPACE") || "",
        taskQueue: config.get<string>("TEMPORAL_TASK_QUEUE") || "",
        workflowsPath: require.resolve("./workflows/token-validation.workflow"),
        activityClasses: [TokenValidationActivity],
        runtimeOptions: {
          telemetryOptions: {
            logging: {
              console: {},
            },
          },
        },
      }),
    }),

    // Register Temporal Client
    TemporalClientModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        connection: {
          address: config.get("TEMPORAL_HOST"),
          tls: {
            clientCertPair: {
              crt: Buffer.from(
                config.get<string>("TEMPORAL_CERT") || "",
                "base64"
              ),
              key: Buffer.from(
                config.get<string>("TEMPORAL_KEY") || "",
                "base64"
              ),
            },
          },
        },
        namespace: config.get("TEMPORAL_NAMESPACE"),
      }),
    }),
  ],
  providers: [TokenValidationActivity, AuthService],
  exports: [AuthService],
})
export class AuthModule {}
