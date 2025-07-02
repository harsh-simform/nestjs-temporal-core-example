import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TemporalModule } from "nestjs-temporal-core";

// Import our activities
import { EmailActivities } from "./activities/email.activities";
import { PaymentActivities } from "./activities/payment.activities";
import { InventoryActivities } from "./activities/inventory.activities";

// Import our REST controllers and services
import { OrderController } from "./controllers/order.controller";
import { OrderService } from "./services/order.service";

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
        // Only configure TLS if certificates are provided
        const tlsCert = configService.get("TEMPORAL_TLS_CERT");
        const tlsKey = configService.get("TEMPORAL_TLS_KEY");

        let tlsConfig = undefined;
        if (tlsCert && tlsKey) {
          const crt = Buffer.from(tlsCert, "base64");
          const key = Buffer.from(tlsKey, "base64");
          tlsConfig = {
            clientCertPair: { crt, key },
          };
        }

        return {
          connection: {
            address: configService.get("TEMPORAL_ADDRESS", "localhost:7233"),
            namespace: configService.get("TEMPORAL_NAMESPACE", "default"),
            ...(tlsConfig && { tls: tlsConfig }),
          },
          taskQueue: configService.get(
            "TEMPORAL_TASK_QUEUE",
            "order-processing"
          ),
          worker: {
            // Path to compiled workflow files
            workflowsPath: require.resolve("./workflows"),
            // Activity classes that will be auto-discovered
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
    // REST API controllers only
    OrderController,
  ],
  providers: [
    // Activity classes (auto-discovered by Temporal worker)
    EmailActivities,
    PaymentActivities,
    InventoryActivities,

    // Regular NestJS services
    OrderService,
  ],
})
export class AppModule {}
