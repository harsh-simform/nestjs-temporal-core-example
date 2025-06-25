import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TemporalModule } from "nestjs-temporal-core";

// Import our workflow controllers and activities
import { OrderWorkflowController } from "./workflows/order.workflow";
import { ReportWorkflowController } from "./workflows/report.workflow";
import { EmailActivities } from "./activities/email.activities";
import { PaymentActivities } from "./activities/payment.activities";
import { InventoryActivities } from "./activities/inventory.activities";

// Import our REST controllers and services
import { OrderController } from "./controllers/order.controller";
import { AdminController } from "./controllers/admin.controller";
import { OrderService } from "./services/order.service";
import { AdminService } from "./services/admin.service";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // Temporal integration with auto-discovery
    TemporalModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const crt = Buffer.from(
          configService.get("TEMPORAL_TLS_CERT"),
          "base64"
        );
        const key = Buffer.from(
          configService.get("TEMPORAL_TLS_KEY"),
          "base64"
        );
        return {
          connection: {
            address: configService.get("TEMPORAL_ADDRESS", "localhost:7233"),
            namespace: configService.get("TEMPORAL_NAMESPACE", "default"),
            tls: {
              clientCertPair: {
                crt,
                key,
              },
            },
          },
          taskQueue: configService.get(
            "TEMPORAL_TASK_QUEUE",
            "order-processing"
          ),
          worker: {
            workflowsPath: require.resolve("./workflows"),
            activityClasses: [
              EmailActivities,
              PaymentActivities,
              InventoryActivities,
            ],
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [
    // REST API controllers
    OrderController,
    AdminController,

    // Temporal workflow controllers (auto-discovered)
    OrderWorkflowController,
    ReportWorkflowController,
  ],
  providers: [
    // Activity classes (auto-discovered)
    EmailActivities,
    PaymentActivities,
    InventoryActivities,

    // Regular services
    OrderService,
    AdminService,
  ],
})
export class AppModule {}
